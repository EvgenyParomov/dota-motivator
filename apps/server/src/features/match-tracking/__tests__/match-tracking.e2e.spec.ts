import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import { matchEvents, users } from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Трекинг матчей Dota', () => {
  let stack: TestStack;
  let app: Express;
  let db: Db;
  const userA = '00000000-0000-0000-0000-000000000ea1';
  const userB = '00000000-0000-0000-0000-000000000ea2';
  const tokenA = 'mt-token-a';
  const tokenB = 'mt-token-b';

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
        name: 'mt-tester',
        steamId: `765611980000${u.slice(-4)}`,
      });
      await stack.container.get(ProfileInitializer).initialize(u);
    }
    // Onboard userA with a non-zero debtThreshold for allow/block tests.
    await request(app)
      .post('/profile/complete-onboarding')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ debtThreshold: 1, startingBalance: 5 });
    await request(app)
      .post('/profile/complete-onboarding')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ debtThreshold: 0, startingBalance: 0 });
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  describe('Сообщение об окончании матча', () => {
    it('POST /match-events с phase=post_game списывает 1 катку и возвращает обновлённый баланс', async () => {
      const before = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ matchId: 'mt-first', phase: 'post_game', lobbyType: 'public' });
      expect(r.status).toBe(200);
      expect(r.body.counted).toBe(true);
      const after = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      expect(before.body.balance - after.body.balance).toBe(1);
    });

    it('повторный POST с тем же matchId возвращает успех без повторного списания', async () => {
      const balanceBefore = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ matchId: 'mt-first', phase: 'post_game', lobbyType: 'public' });
      expect(r.status).toBe(200);
      expect(r.body.duplicate).toBe(true);
      const balanceAfter = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(balanceAfter.body.balance).toBe(balanceBefore.body.balance);
    });

    it('POST с lobbyType practice не списывает катку, но событие сохраняется', async () => {
      const before = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      const r = await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ matchId: 'mt-practice', phase: 'post_game', lobbyType: 'practice' });
      expect(r.status).toBe(200);
      expect(r.body.counted).toBe(false);
      const after = await request(app).get('/balance').set('Authorization', `Bearer ${tokenA}`);
      expect(after.body.balance).toBe(before.body.balance);
      const rows = await db
        .select()
        .from(matchEvents)
        .where(
          and(eq(matchEvents.userId, userA), eq(matchEvents.matchId, 'mt-practice')),
        );
      expect(rows.length).toBe(1);
    });

    it('POST /match-events без авторизации возвращает 401', async () => {
      const r = await request(app)
        .post('/match-events')
        .send({ matchId: 'mt-noauth', phase: 'post_game', lobbyType: 'public' });
      expect(r.status).toBe(401);
    });

    it('match_events содержит matchId, startedAt, endedAt, lobbyType после успешного post_game', async () => {
      const startedAt = new Date('2026-05-18T10:00:00Z').toISOString();
      const endedAt = new Date('2026-05-18T10:35:00Z').toISOString();
      const r = await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          matchId: 'mt-fields',
          phase: 'post_game',
          lobbyType: 'public',
          startedAt,
          endedAt,
        });
      expect(r.status).toBe(200);
      const rows = await db
        .select()
        .from(matchEvents)
        .where(and(eq(matchEvents.userId, userA), eq(matchEvents.matchId, 'mt-fields')));
      expect(rows.length).toBe(1);
      const row = rows[0]!;
      expect(row.matchId).toBe('mt-fields');
      expect(row.lobbyType).toBe('public');
      expect(row.startedAt?.toISOString()).toBe(startedAt);
      expect(row.endedAt?.toISOString()).toBe(endedAt);
    });
  });

  describe('Запрос решения о матче', () => {
    it('GET /match-events/play-decision при balance > -debtThreshold возвращает allow', async () => {
      const r = await request(app)
        .get('/match-events/play-decision')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      expect(r.body.allowed).toBe(true);
    });

    it('GET /match-events/play-decision при balance <= -debtThreshold возвращает block с причиной', async () => {
      // Drain userB's balance below the threshold (=0). Initial balance is 0,
      // so a single post_game match leaves balance=-1 which is <= -0.
      await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ matchId: 'mt-block-1', phase: 'post_game', lobbyType: 'public' });
      const r = await request(app)
        .get('/match-events/play-decision')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(r.body.allowed).toBe(false);
      expect(typeof r.body.reason).toBe('string');
    });

    it('GET /match-events/play-decision без авторизации возвращает 401', async () => {
      const r = await request(app).get('/match-events/play-decision');
      expect(r.status).toBe(401);
    });
  });

  describe('История матчей', () => {
    it('GET /match-events возвращает матчи текущего пользователя', async () => {
      await request(app)
        .post('/match-events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ matchId: 'mt-hist-a', phase: 'post_game', lobbyType: 'public' });
      const r = await request(app).get('/match-events').set('Authorization', `Bearer ${tokenA}`);
      expect(r.status).toBe(200);
      const ids = r.body.map((m: { matchId: string }) => m.matchId);
      expect(ids).toContain('mt-hist-a');
    });

    it('матчи чужих пользователей не возвращаются', async () => {
      const r = await request(app).get('/match-events').set('Authorization', `Bearer ${tokenB}`);
      const ids = r.body.map((m: { matchId: string }) => m.matchId);
      expect(ids).not.toContain('mt-hist-a');
      expect(ids).not.toContain('mt-first');
    });
  });
});
