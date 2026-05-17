import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import type { Express } from 'express';
import type { Container } from 'inversify';
import { startTestStack, type TestStack } from '../helpers/testcontainers.js';
import { users } from '../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../shared/adapters/db/connection.js';
import { DbToken } from '../../app/tokens.js';

describe('Happy path integration', () => {
  let stack: TestStack;
  let app: Express;
  let container: Container;
  const userId = '00000000-0000-0000-0000-000000000001';
  const token = 'test-token-1';

  beforeAll(async () => {
    const tokenMap = new Map([[token, { kind: 'authenticated' as const, userId }]]);
    stack = await startTestStack(tokenMap);
    app = stack.app;
    container = stack.container;
    const db = container.get<Db>(DbToken);
    await db.insert(users).values({
      id: userId,
      email: 'test@steam.local',
      name: 'tester',
      steamId: '76561198000000999',
    });
    await container.get(ProfileInitializer).initialize(userId);
  }, 120_000);

  afterAll(async () => {
    await stack.stop();
  });

  it('protected endpoint without token returns 401', async () => {
    const r = await request(app).get('/balance');
    expect(r.status).toBe(401);
  });

  it('GET /profile returns defaults after init', async () => {
    const r = await request(app).get('/profile').set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body.debtThreshold).toBe(0);
    expect(r.body.onboardingCompleted).toBe(false);
  });

  it('complete onboarding sets debt threshold and starting balance', async () => {
    const r = await request(app)
      .post('/profile/complete-onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ debtThreshold: 2, startingBalance: 3 });
    expect(r.status).toBe(204);

    const balance = await request(app).get('/balance').set('Authorization', `Bearer ${token}`);
    expect(balance.body.balance).toBe(3);
    expect(balance.body.debtThreshold).toBe(2);
    expect(balance.body.canPlayMore).toBe(true);
  });

  it('repeated onboarding returns 409', async () => {
    const r = await request(app)
      .post('/profile/complete-onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ debtThreshold: 2, startingBalance: 3 });
    expect(r.status).toBe(409);
  });

  it('create + execute lot credits balance', async () => {
    const created = await request(app)
      .post('/lots')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'run', sphere: 'health', reward: 1, rules: [] });
    expect(created.status).toBe(201);
    const lotId = created.body.id as string;

    const executed = await request(app)
      .post(`/lots/${lotId}/execute`)
      .set('Authorization', `Bearer ${token}`);
    expect(executed.status).toBe(201);

    const balance = await request(app).get('/balance').set('Authorization', `Bearer ${token}`);
    expect(balance.body.balance).toBe(4);
  });

  it('match post_game debits 1 katka and is idempotent by matchId', async () => {
    const first = await request(app)
      .post('/match-events')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId: 'match-1', phase: 'post_game', lobbyType: 'public' });
    expect(first.status).toBe(200);
    expect(first.body.counted).toBe(true);

    const dup = await request(app)
      .post('/match-events')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId: 'match-1', phase: 'post_game', lobbyType: 'public' });
    expect(dup.status).toBe(200);
    expect(dup.body.duplicate).toBe(true);

    const balance = await request(app).get('/balance').set('Authorization', `Bearer ${token}`);
    expect(balance.body.balance).toBe(3);
  });

  it('practice lobby is not counted', async () => {
    const r = await request(app)
      .post('/match-events')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId: 'match-2', phase: 'post_game', lobbyType: 'practice' });
    expect(r.body.counted).toBe(false);
    const balance = await request(app).get('/balance').set('Authorization', `Bearer ${token}`);
    expect(balance.body.balance).toBe(3);
  });
});
