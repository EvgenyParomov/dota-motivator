import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import { users } from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Статистика', () => {
  let stack: TestStack;
  let app: Express;
  const userA = '00000000-0000-0000-0000-000000000fa1';
  const userB = '00000000-0000-0000-0000-000000000fa2';
  const tokenA = 'stats-token-a';
  const tokenB = 'stats-token-b';

  beforeAll(async () => {
    const tokenMap = new Map([
      [tokenA, { kind: 'authenticated' as const, userId: userA }],
      [tokenB, { kind: 'authenticated' as const, userId: userB }],
    ]);
    stack = await startTestStack(tokenMap);
    app = stack.app;
    const db = stack.container.get<Db>(DbToken);

    for (const [u, token] of [
      [userA, tokenA],
      [userB, tokenB],
    ] as const) {
      await db.insert(users).values({
        id: u,
        email: `${u}@steam.local`,
        name: 'stats-tester',
        steamId: `765611980000${u.slice(-4)}`,
      });
      await stack.container.get(ProfileInitializer).initialize(u);
      await request(app)
        .post('/profile/complete-onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 0, startingBalance: 0 });
    }

    // Seed activity for userA only — userB stays empty.
    const lot = await request(app)
      .post('/lots')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'stat-lot', sphere: 'health', reward: 1, rules: [] });
    expect(lot.status).toBe(201);
    const executed = await request(app)
      .post(`/lots/${lot.body.id}/execute`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(executed.status).toBe(201);
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  describe('Чтение агрегатов', () => {
    it('GET /statistics?period=week возвращает все 5 секций (spheres, topLots, events, heatmap, orphans)', async () => {
      const r = await request(app)
        .get('/statistics?period=week')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body.spheres)).toBe(true);
      expect(Array.isArray(r.body.topLots)).toBe(true);
      expect(Array.isArray(r.body.events)).toBe(true);
      expect(Array.isArray(r.body.heatmap)).toBe(true);
      expect(Array.isArray(r.body.orphans)).toBe(true);
    });

    it('GET /statistics?period=month возвращает данные с теми же полями', async () => {
      const r = await request(app)
        .get('/statistics?period=month')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(r.body.period).toBe('month');
      expect(Array.isArray(r.body.spheres)).toBe(true);
      expect(Array.isArray(r.body.topLots)).toBe(true);
      expect(Array.isArray(r.body.events)).toBe(true);
      expect(Array.isArray(r.body.heatmap)).toBe(true);
      expect(Array.isArray(r.body.orphans)).toBe(true);
    });

    it('GET /statistics с невалидным period возвращает 400', async () => {
      const r = await request(app)
        .get('/statistics?period=bogus')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(400);
    });

    it('GET /statistics без авторизации возвращает 401', async () => {
      const r = await request(app).get('/statistics?period=week');
      expect(r.status).toBe(401);
    });

    it('данные чужих пользователей не утекают', async () => {
      // period=month uses JS clock (first day of UTC month) for range.from,
      // avoiding flaky clock skew between testcontainer Postgres (drives
      // user.createdAt via NOW()) and the host (drives lot_executions.createdAt)
      // when activity is seeded just before the test runs.
      const a = await request(app)
        .get('/statistics?period=month')
        .set('Authorization', `Bearer ${tokenA}`);
      const b = await request(app)
        .get('/statistics?period=month')
        .set('Authorization', `Bearer ${tokenB}`);
      const aLots = a.body.topLots.length;
      const bLots = b.body.topLots.length;
      expect(aLots).toBeGreaterThan(0);
      expect(bLots).toBe(0);
      const aEvents = a.body.events.length;
      expect(aEvents).toBeGreaterThan(0);
      expect(b.body.events.length).toBe(0);
    });
  });
});
