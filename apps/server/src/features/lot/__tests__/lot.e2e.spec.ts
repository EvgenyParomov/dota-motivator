import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import { lots, users } from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Лоты', () => {
  let stack: TestStack;
  let app: Express;
  let db: Db;
  const userA = '00000000-0000-0000-0000-000000000ca1';
  const userB = '00000000-0000-0000-0000-000000000ca2';
  const tokenA = 'lot-token-a';
  const tokenB = 'lot-token-b';

  beforeAll(async () => {
    const tokenMap = new Map([
      [tokenA, { kind: 'authenticated' as const, userId: userA }],
      [tokenB, { kind: 'authenticated' as const, userId: userB }],
    ]);
    stack = await startTestStack(tokenMap);
    app = stack.app;
    db = stack.container.get<Db>(DbToken);

    for (const [u, token] of [
      [userA, tokenA],
      [userB, tokenB],
    ] as const) {
      await db.insert(users).values({
        id: u,
        email: `${u}@steam.local`,
        name: 'lot-tester',
        steamId: `765611980000${u.slice(-4)}`,
      });
      await stack.container.get(ProfileInitializer).initialize(u);
      await request(app)
        .post('/profile/complete-onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 0, startingBalance: 0 });
    }
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  describe('Создание', () => {
    it('POST /lots с валидными данными создаёт лот и возвращает его', async () => {
      const r = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'run', sphere: 'health', reward: 1, rules: [] });
      expect(r.status).toBe(201);
      expect(r.body.id).toBeDefined();
      expect(r.body.name).toBe('run');
    });

    it('POST /lots с невалидным reward возвращает 400', async () => {
      const r = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'bad', sphere: 'health', reward: -1, rules: [] });
      expect(r.status).toBe(400);
    });

    it('POST /lots с пустым именем возвращает 400', async () => {
      const r = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '   ', sphere: 'health', reward: 1, rules: [] });
      expect(r.status).toBe(400);
    });

    it('POST /lots без авторизации возвращает 401', async () => {
      const r = await request(app)
        .post('/lots')
        .send({ name: 'noauth', sphere: 'health', reward: 1, rules: [] });
      expect(r.status).toBe(401);
    });

    it('лот создаётся с userId из auth-контекста (значение userId в теле игнорируется)', async () => {
      const r = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'ctx-lot',
          sphere: 'health',
          reward: 1,
          rules: [],
          userId: userB,
        });
      expect(r.status).toBe(201);
      const row = (await db.select().from(lots).where(eq(lots.id, r.body.id)))[0];
      expect(row?.userId).toBe(userA);
    });
  });

  describe('Обновление', () => {
    it('PATCH /lots/:id с валидными данными обновляет лот', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'upd', sphere: 'health', reward: 1, rules: [] });
      const patched = await request(app)
        .patch(`/lots/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'upd2', sphere: 'growth', reward: 2, rules: [] });
      expect(patched.status).toBe(200);
      expect(patched.body.name).toBe('upd2');
      expect(patched.body.sphere).toBe('growth');
      expect(Number(patched.body.reward)).toBe(2);
    });

    it('PATCH /lots/:id чужого пользователя возвращает 404', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'mine', sphere: 'health', reward: 1, rules: [] });
      const r = await request(app)
        .patch(`/lots/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'hijack', sphere: 'growth', reward: 1, rules: [] });
      expect(r.status).toBe(404);
    });

    it('PATCH /lots/:id с пустым именем возвращает 400', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'name', sphere: 'health', reward: 1, rules: [] });
      const r = await request(app)
        .patch(`/lots/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: '   ', sphere: 'health', reward: 1, rules: [] });
      expect(r.status).toBe(400);
    });
  });

  describe('Архивация', () => {
    it('POST /lots/:id/archive помечает is_active=false в БД', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'arc', sphere: 'health', reward: 1, rules: [] });
      const r = await request(app)
        .post(`/lots/${created.body.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(204);
      const row = (await db.select().from(lots).where(eq(lots.id, created.body.id)))[0];
      expect(row?.isActive).toBe(false);
    });

    it('повторная архивация того же лота — успешный ответ без ошибки', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'arc2', sphere: 'health', reward: 1, rules: [] });
      await request(app)
        .post(`/lots/${created.body.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post(`/lots/${created.body.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect([200, 204]).toContain(r.status);
    });

    it('POST /lots/:id/archive чужого пользователя возвращает 404', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'arc3', sphere: 'health', reward: 1, rules: [] });
      const r = await request(app)
        .post(`/lots/${created.body.id}/archive`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(r.status).toBe(404);
    });
  });

  describe('Чтение', () => {
    it('GET /lots возвращает только активные лоты текущего пользователя', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'b-active', sphere: 'health', reward: 1, rules: [] });
      const archived = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'b-archived', sphere: 'health', reward: 1, rules: [] });
      await request(app)
        .post(`/lots/${archived.body.id}/archive`)
        .set('Authorization', `Bearer ${tokenB}`);

      const r = await request(app).get('/lots').set('Authorization', `Bearer ${tokenB}`);
      expect(r.status).toBe(200);
      const ids = r.body.map((l: { id: string }) => l.id);
      expect(ids).toContain(created.body.id);
      expect(ids).not.toContain(archived.body.id);
      // Lots created by userA shouldn't leak into userB's list.
      const userAOnly = r.body.find(
        (l: { userId: string }) => l.userId === userA,
      );
      expect(userAOnly).toBeUndefined();
    });

    it('GET /lots/:id возвращает детали лота', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'det', sphere: 'health', reward: 1, rules: [] });
      const r = await request(app)
        .get(`/lots/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(r.body.id).toBe(created.body.id);
      expect(r.body.name).toBe('det');
    });

    it('GET /lots/:id чужого пользователя возвращает 404', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'foreign', sphere: 'health', reward: 1, rules: [] });
      const r = await request(app)
        .get(`/lots/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(r.status).toBe(404);
    });

    it('GET /lots с архивированным лотом не включает его в список', async () => {
      const archived = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'arc-list', sphere: 'health', reward: 1, rules: [] });
      await request(app)
        .post(`/lots/${archived.body.id}/archive`)
        .set('Authorization', `Bearer ${tokenA}`);

      const r = await request(app).get('/lots').set('Authorization', `Bearer ${tokenA}`);
      const ids = r.body.map((l: { id: string }) => l.id);
      expect(ids).not.toContain(archived.body.id);
    });

    it('GET /lots после выполнения DailyLimit-лота возвращает canExecuteNow.allowed=false', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'daily-lot',
          sphere: 'health',
          reward: 1,
          rules: [{ type: 'daily-limit', count: 1 }],
        });
      await request(app)
        .post(`/lots/${created.body.id}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);

      const r = await request(app).get('/lots').set('Authorization', `Bearer ${tokenA}`);
      const lot = (r.body as Array<{ id: string; canExecuteNow: { allowed: boolean } }>).find(
        (l) => l.id === created.body.id,
      );
      expect(lot?.canExecuteNow.allowed).toBe(false);
    });
  });
});
