import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import {
  balanceEvents,
  lotExecutions,
  matchEvents,
  users,
} from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Баланс каток', () => {
  let stack: TestStack;
  let app: Express;
  let db: Db;
  const userA = '00000000-0000-0000-0000-000000000ba1';
  const userB = '00000000-0000-0000-0000-000000000ba2';
  const tokenA = 'balance-token-a';
  const tokenB = 'balance-token-b';

  beforeAll(async () => {
    const tokenMap = new Map([
      [tokenA, { kind: 'authenticated' as const, userId: userA }],
      [tokenB, { kind: 'authenticated' as const, userId: userB }],
    ]);
    stack = await startTestStack(tokenMap);
    app = stack.app;
    db = stack.container.get<Db>(DbToken);

    for (const u of [userA, userB]) {
      await db.insert(users).values({
        id: u,
        email: `${u}@steam.local`,
        name: 'balance-tester',
        steamId: `765611980000${u.slice(-4)}`,
      });
      await stack.container.get(ProfileInitializer).initialize(u);
    }

    // Complete onboarding for userA so credits/debits via use-cases stay consistent.
    await request(app)
      .post('/profile/complete-onboarding')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ debtThreshold: 0, startingBalance: 0 });
    await request(app)
      .post('/profile/complete-onboarding')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ debtThreshold: 0, startingBalance: 0 });
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  describe('Чтение баланса', () => {
    it('GET /balance возвращает balance, debtThreshold, canPlayMore', async () => {
      const r = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(typeof r.body.balance).toBe('number');
      expect(typeof r.body.debtThreshold).toBe('number');
      expect(typeof r.body.canPlayMore).toBe('boolean');
    });

    it('GET /balance без авторизации возвращает 401', async () => {
      const r = await request(app).get('/balance');
      expect(r.status).toBe(401);
    });
  });

  describe('История баланса', () => {
    it('GET /balance/events возвращает события текущего пользователя в порядке возрастания createdAt', async () => {
      // Generate two events: create+execute two lots.
      for (const name of ['e1', 'e2']) {
        const lot = await request(app)
          .post('/lots')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ name, sphere: 'health', reward: 1, rules: [] });
        await request(app)
          .post(`/lots/${lot.body.id}/execute`)
          .set('Authorization', `Bearer ${tokenA}`);
      }

      const r = await request(app).get('/balance/events').set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
      expect(r.body.length).toBeGreaterThanOrEqual(2);
      const dates = r.body.map((e: { createdAt: string }) => new Date(e.createdAt).getTime());
      const sorted = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sorted);
    });

    it('GET /balance/events с from/to возвращает только попавшие в диапазон', async () => {
      const all = await request(app)
        .get('/balance/events')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(all.body.length).toBeGreaterThan(0);
      const future = new Date(Date.now() + 60_000).toISOString();
      const r = await request(app)
        .get(`/balance/events?from=${encodeURIComponent(future)}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.body).toEqual([]);
    });

    it('события чужих пользователей не возвращаются', async () => {
      const a = await request(app).get('/balance/events').set('Authorization', `Bearer ${tokenA}`);
      const b = await request(app).get('/balance/events').set('Authorization', `Bearer ${tokenB}`);
      expect(a.body.length).toBeGreaterThan(0);
      expect(b.body).toEqual([]);
    });
  });

  describe('Атомарность изменений', () => {
    it('после успешного исполнения лота balance_events.cause_id ссылается на lot_executions.id', async () => {
      const created = await request(app)
        .post('/lots')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'cause-lot', sphere: 'health', reward: 1, rules: [] });
      const executed = await request(app)
        .post(`/lots/${created.body.id}/execute`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(executed.status).toBe(201);
      const execId = executed.body.executionId as string;

      const eventRows = await db
        .select()
        .from(balanceEvents)
        .where(
          and(
            eq(balanceEvents.userId, userB),
            eq(balanceEvents.causeKind, 'lot-execution'),
            eq(balanceEvents.causeId, execId),
          ),
        );
      expect(eventRows.length).toBe(1);

      const execRows = await db
        .select()
        .from(lotExecutions)
        .where(eq(lotExecutions.id, execId));
      expect(execRows.length).toBe(1);
    });

    it('после успешного post_game balance_events.cause_id ссылается на match_events.id', async () => {
      const matchId = `match-${Date.now()}`;
      const r = await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ matchId, phase: 'post_game', lobbyType: 'public' });
      expect(r.status).toBe(200);
      expect(r.body.counted).toBe(true);

      const matchRows = await db
        .select()
        .from(matchEvents)
        .where(and(eq(matchEvents.userId, userB), eq(matchEvents.matchId, matchId)));
      expect(matchRows.length).toBe(1);

      const eventRows = await db
        .select()
        .from(balanceEvents)
        .where(
          and(
            eq(balanceEvents.userId, userB),
            eq(balanceEvents.causeKind, 'match'),
            eq(balanceEvents.causeId, matchRows[0]!.id),
          ),
        );
      expect(eventRows.length).toBe(1);
    });
  });
});
