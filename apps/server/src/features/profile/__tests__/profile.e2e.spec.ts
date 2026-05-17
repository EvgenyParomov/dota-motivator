import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import { profiles, users } from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Профиль пользователя', () => {
  let stack: TestStack;
  let app: Express;
  let db: Db;
  const userId = '00000000-0000-0000-0000-000000000bb1';
  const token = 'profile-token-1';

  beforeAll(async () => {
    const tokenMap = new Map([[token, { kind: 'authenticated' as const, userId }]]);
    stack = await startTestStack(tokenMap);
    app = stack.app;
    db = stack.container.get<Db>(DbToken);
    await db.insert(users).values({
      id: userId,
      email: `${userId}@steam.local`,
      name: 'profile-tester',
      steamId: '7656119800000bb01',
    });
    await stack.container.get(ProfileInitializer).initialize(userId);
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  beforeEach(async () => {
    // Reset profile to defaults before each test (some tests mutate it).
    await db
      .update(profiles)
      .set({ debtThreshold: 0, onboardingCompleted: false })
      .where(eq(profiles.userId, userId));
  });

  describe('Чтение профиля', () => {
    it('GET /profile возвращает текущий debtThreshold и onboardingCompleted', async () => {
      const r = await request(app).get('/profile').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(200);
      expect(r.body.debtThreshold).toBe(0);
      expect(r.body.onboardingCompleted).toBe(false);
    });

    it('GET /profile без авторизации возвращает 401', async () => {
      const r = await request(app).get('/profile');
      expect(r.status).toBe(401);
    });
  });

  describe('Обновление порога долга', () => {
    it('PATCH /profile с валидным debtThreshold сохраняет значение и читается через GET /profile', async () => {
      const patch = await request(app)
        .patch('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 7 });
      expect(patch.status).toBe(204);

      const get = await request(app).get('/profile').set('Authorization', `Bearer ${token}`);
      expect(get.body.debtThreshold).toBe(7);
    });

    it('PATCH /profile с отрицательным debtThreshold возвращает 400', async () => {
      const r = await request(app)
        .patch('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: -1 });
      expect(r.status).toBe(400);
    });

    it('PATCH /profile без авторизации возвращает 401', async () => {
      const r = await request(app).patch('/profile').send({ debtThreshold: 3 });
      expect(r.status).toBe(401);
    });
  });

  describe('Завершение онбординга', () => {
    it('POST /profile/complete-onboarding со стартовым балансом проставляет флаг и стартовый баланс', async () => {
      const r = await request(app)
        .post('/profile/complete-onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 2, startingBalance: 5 });
      expect(r.status).toBe(204);

      const profile = await request(app).get('/profile').set('Authorization', `Bearer ${token}`);
      expect(profile.body.onboardingCompleted).toBe(true);
      expect(profile.body.debtThreshold).toBe(2);

      const balance = await request(app).get('/balance').set('Authorization', `Bearer ${token}`);
      expect(balance.body.balance).toBe(5);
    });

    it('повторный POST /profile/complete-onboarding возвращает 409', async () => {
      await request(app)
        .post('/profile/complete-onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 1, startingBalance: 1 });

      const r = await request(app)
        .post('/profile/complete-onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ debtThreshold: 1, startingBalance: 1 });
      expect(r.status).toBe(409);
    });
  });
});
