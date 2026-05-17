import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import {
  balanceEvents,
  lotExecutions,
  users,
} from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Выполнение лотов', () => {
  let stack: TestStack;
  let app: Express;
  let db: Db;
  const userA = '00000000-0000-0000-0000-000000000da1';
  const userB = '00000000-0000-0000-0000-000000000da2';
  const tokenA = 'lex-token-a';
  const tokenB = 'lex-token-b';

  const createLot = async (
    token: string,
    body: { name: string; rules?: unknown[]; reward?: number; sphere?: string },
  ): Promise<string> => {
    const r = await request(app)
      .post('/lots')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: body.name,
        sphere: body.sphere ?? 'health',
        reward: body.reward ?? 1,
        rules: body.rules ?? [],
      });
    expect(r.status).toBe(201);
    return r.body.id as string;
  };

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
        name: 'lex-tester',
        steamId: `765611980000${u.slice(-4)}`,
      });
      await stack.container.get(ProfileInitializer).initialize(u);
      // complete-onboarding creates the balance row; otherwise BalanceMutator
      // can't increment.
      await request(app)
        .post('/profile/complete-onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 0, startingBalance: 0 });
    }
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  describe('Успешное выполнение', () => {
    it('POST /lots/:id/execute создаёт LotExecution и увеличивает баланс на reward', async () => {
      const lotId = await createLot(tokenA, { name: 'ok', reward: 2 });
      const before = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(201);
      const after = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      expect(after.body.balance - before.body.balance).toBeCloseTo(2);
    });

    it('ответ содержит обновлённый баланс и созданное событие', async () => {
      const lotId = await createLot(tokenA, { name: 'resp' });
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(201);
      expect(typeof r.body.executionId).toBe('string');
      expect(r.body.executionId.length).toBeGreaterThan(0);
    });

    it('balance_events.cause_id ссылается на lot_executions.id', async () => {
      const lotId = await createLot(tokenA, { name: 'caused' });
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      const execId = r.body.executionId as string;
      const rows = await db
        .select()
        .from(balanceEvents)
        .where(
          and(
            eq(balanceEvents.userId, userA),
            eq(balanceEvents.causeKind, 'lot-execution'),
            eq(balanceEvents.causeId, execId),
          ),
        );
      expect(rows.length).toBe(1);
    });
  });

  describe('Нарушения правил', () => {
    it('POST /lots/:id/execute при превышении DailyLimit возвращает 422 с причиной', async () => {
      const lotId = await createLot(tokenA, {
        name: 'daily',
        rules: [{ type: 'daily-limit', count: 1 }],
      });
      const first = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(first.status).toBe(201);
      const second = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(second.status).toBe(422);
      expect(typeof second.body.message).toBe('string');
    });

    it('POST /lots/:id/execute во время Cooldown возвращает 422', async () => {
      const lotId = await createLot(tokenA, {
        name: 'cooldown',
        rules: [{ type: 'cooldown', minutes: 60 }],
      });
      await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(422);
    });

    it('POST /lots/:id/execute на OneTime после первого выполнения возвращает 422', async () => {
      const lotId = await createLot(tokenA, {
        name: 'one-time',
        rules: [{ type: 'one-time' }],
      });
      await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(422);
    });

    it('после отказа из-за правила не создаётся ни LotExecution, ни balance_event', async () => {
      const lotId = await createLot(tokenA, {
        name: 'noop-after-violation',
        rules: [{ type: 'one-time' }],
      });
      await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      const beforeExec = (await db
        .select()
        .from(lotExecutions)
        .where(and(eq(lotExecutions.userId, userA), eq(lotExecutions.lotId, lotId)))).length;
      const beforeEv = (await db
        .select()
        .from(balanceEvents)
        .where(eq(balanceEvents.userId, userA))).length;

      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(422);

      const afterExec = (await db
        .select()
        .from(lotExecutions)
        .where(and(eq(lotExecutions.userId, userA), eq(lotExecutions.lotId, lotId)))).length;
      const afterEv = (await db
        .select()
        .from(balanceEvents)
        .where(eq(balanceEvents.userId, userA))).length;
      expect(afterExec).toBe(beforeExec);
      expect(afterEv).toBe(beforeEv);
    });
  });

  describe('Ошибки доступа', () => {
    it('POST /lots/:id/execute на чужой лот возвращает 404', async () => {
      const lotId = await createLot(tokenA, { name: 'mine' });
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(r.status).toBe(404);
    });

    it('POST /lots/:id/execute на архивный лот возвращает 410', async () => {
      const lotId = await createLot(tokenA, { name: 'arc-exec' });
      await request(app)
        .post(`/lots/${lotId}/archive`)
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(410);
    });

    it('POST /lots/:id/execute без авторизации возвращает 401', async () => {
      const lotId = await createLot(tokenA, { name: 'noauth-exec' });
      const r = await request(app).post(`/lots/${lotId}/execute`);
      expect(r.status).toBe(401);
    });
  });

  describe('История', () => {
    it('GET /lot-executions?lotId=:id возвращает выполнения этого лота', async () => {
      const lotId = await createLot(tokenA, { name: 'hist-1' });
      await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .get(`/lot-executions?lotId=${lotId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(r.body.length).toBeGreaterThanOrEqual(1);
      for (const exec of r.body) {
        expect(exec.lotId).toBe(lotId);
      }
    });

    it('GET /lot-executions возвращает все выполнения текущего пользователя', async () => {
      const a = await createLot(tokenA, { name: 'hist-2a' });
      const b = await createLot(tokenA, { name: 'hist-2b' });
      await request(app).post(`/lots/${a}/execute`).set('Authorization', `Bearer ${tokenA}`);
      await request(app).post(`/lots/${b}/execute`).set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .get('/lot-executions')
        .set('Authorization', `Bearer ${tokenA}`);
      const lotIds = new Set(r.body.map((e: { lotId: string }) => e.lotId));
      expect(lotIds.has(a)).toBe(true);
      expect(lotIds.has(b)).toBe(true);
    });

    it('события чужих пользователей не возвращаются', async () => {
      const lotId = await createLot(tokenA, { name: 'iso' });
      await request(app)
        .post(`/lots/${lotId}/execute`)
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .get('/lot-executions')
        .set('Authorization', `Bearer ${tokenB}`);
      const ids = new Set(r.body.map((e: { lotId: string }) => e.lotId));
      expect(ids.has(lotId)).toBe(false);
    });
  });
});
