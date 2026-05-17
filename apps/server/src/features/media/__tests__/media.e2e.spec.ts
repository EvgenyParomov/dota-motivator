import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestStack, type TestStack } from '../../../__tests__/helpers/testcontainers.js';
import { users } from '../../../shared/adapters/db/schema/index.js';
import { ProfileInitializer } from '../../../shared/application/ports/profile-initializer.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

describe('Загрузка медиа', () => {
  let stack: TestStack;
  let app: Express;
  const userId = '00000000-0000-0000-0000-000000000aa1';
  const token = 'media-token-1';

  beforeAll(async () => {
    const tokenMap = new Map([[token, { kind: 'authenticated' as const, userId }]]);
    stack = await startTestStack(tokenMap);
    app = stack.app;
    const db = stack.container.get<Db>(DbToken);
    await db.insert(users).values({
      id: userId,
      email: `${userId}@steam.local`,
      name: 'media-tester',
      steamId: '7656119800000aa01',
    });
    await stack.container.get(ProfileInitializer).initialize(userId);
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  describe('Запрос пресайна', () => {
    it('POST /media/presign с валидными параметрами возвращает uploadUrl и mediaKey', async () => {
      const r = await request(app)
        .post('/media/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({ mimeType: 'image/png', size: 1024 });
      expect(r.status).toBe(200);
      expect(typeof r.body.uploadUrl).toBe('string');
      expect(r.body.uploadUrl.length).toBeGreaterThan(0);
      expect(typeof r.body.mediaKey).toBe('string');
      expect(r.body.mediaKey.length).toBeGreaterThan(0);
    });

    it('POST /media/presign с запрещённым mimeType возвращает 400', async () => {
      const r = await request(app)
        .post('/media/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({ mimeType: 'image/svg+xml', size: 1024 });
      expect(r.status).toBe(400);
    });

    it('POST /media/presign с size больше лимита возвращает 413', async () => {
      const r = await request(app)
        .post('/media/presign')
        .set('Authorization', `Bearer ${token}`)
        .send({ mimeType: 'image/png', size: 2 * 1024 * 1024 });
      expect(r.status).toBe(413);
    });

    it('POST /media/presign без авторизации возвращает 401', async () => {
      const r = await request(app)
        .post('/media/presign')
        .send({ mimeType: 'image/png', size: 1024 });
      expect(r.status).toBe(401);
    });
  });
});
