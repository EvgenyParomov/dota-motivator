import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import type { Express } from 'express';
import {
  startTestStack,
  type TestStack,
  FakeSteamOpenIdVerifier,
  FakeSteamProfileFetcher,
} from '../../../__tests__/helpers/testcontainers.js';
import {
  authStates,
  profiles,
  sessions,
  users,
} from '../../../shared/adapters/db/schema/index.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { DbToken } from '../../../app/tokens.js';

const allowedCallback = 'http://localhost:5187';

const buildCallbackUrl = (state: string, steamId: string): string => {
  const params = new URLSearchParams({
    state,
    'openid.mode': 'id_res',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.claimed_id': `https://steamcommunity.com/openid/id/${steamId}`,
    'openid.identity': `https://steamcommunity.com/openid/id/${steamId}`,
    'openid.sig': 'fake-sig',
    'openid.signed':
      'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
  });
  return `/auth/steam/callback?${params.toString()}`;
};

const extractStateFromRedirect = (location: string): string => {
  const u = new URL(location);
  const returnTo = u.searchParams.get('openid.return_to');
  if (!returnTo) throw new Error('no return_to in redirect');
  const state = new URL(returnTo).searchParams.get('state');
  if (!state) throw new Error('no state in return_to');
  return state;
};

const startFlowAndGetState = async (app: Express): Promise<string> => {
  const r = await request(app).get(
    `/auth/steam/start?client_callback=${encodeURIComponent(allowedCallback)}`,
  );
  expect(r.status).toBe(302);
  return extractStateFromRedirect(r.headers.location!);
};

describe('Аутентификация', () => {
  let stack: TestStack;
  let app: Express;
  let db: Db;
  let verifier: FakeSteamOpenIdVerifier;
  let profileFetcher: FakeSteamProfileFetcher;

  beforeAll(async () => {
    verifier = new FakeSteamOpenIdVerifier();
    profileFetcher = new FakeSteamProfileFetcher();
    stack = await startTestStack({
      useDbSessionResolver: true,
      steamVerifier: verifier,
      steamProfileFetcher: profileFetcher,
    });
    app = stack.app;
    db = stack.container.get<Db>(DbToken);
  }, 180_000);

  afterAll(async () => {
    await stack.stop();
  });

  beforeEach(() => {
    verifier.result = true;
    profileFetcher.profile = {
      steamId: '76561198000000000',
      personaName: 'tester',
      avatarUrl: 'http://example/a.jpg',
    };
  });

  describe('Старт потока', () => {
    it('GET /auth/steam/start с разрешённым client_callback возвращает 302 на steamcommunity.com', async () => {
      const r = await request(app).get(
        `/auth/steam/start?client_callback=${encodeURIComponent(allowedCallback)}`,
      );
      expect(r.status).toBe(302);
      const target = new URL(r.headers.location!);
      expect(target.host).toBe('steamcommunity.com');
    });

    it('возвращённый redirect содержит свежий state, ранее не существовавший в auth_states', async () => {
      const state = await startFlowAndGetState(app);
      const rows = await db
        .select()
        .from(authStates)
        .where(eq(authStates.state, state));
      expect(rows.length).toBe(1);
      expect(rows[0]?.clientCallback).toBe(allowedCallback);
    });

    it('client_callback вне allowlist отклоняется с 400 и state не создаётся', async () => {
      const countBefore = (await db.select().from(authStates)).length;
      const r = await request(app).get(
        `/auth/steam/start?client_callback=${encodeURIComponent('https://evil.example.com')}`,
      );
      expect(r.status).toBe(400);
      const countAfter = (await db.select().from(authStates)).length;
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('Возврат из Steam', () => {
    it('callback с валидной подписью и валидным state создаёт сессию и редиректит на client_callback', async () => {
      const state = await startFlowAndGetState(app);
      profileFetcher.profile = {
        steamId: '76561198000000111',
        personaName: 'valid',
        avatarUrl: 'http://example/v.jpg',
      };
      const r = await request(app).get(buildCallbackUrl(state, '76561198000000111'));
      expect(r.status).toBe(302);
      const target = new URL(r.headers.location!);
      expect(target.origin).toBe(allowedCallback);
      const token = target.searchParams.get('token');
      expect(token).toBeTruthy();
      const sessionRows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token!));
      expect(sessionRows.length).toBe(1);
    });

    it('callback с битой подписью отклоняется и сессия не создаётся', async () => {
      const state = await startFlowAndGetState(app);
      verifier.result = false;
      const sessionsBefore = (await db.select().from(sessions)).length;
      const r = await request(app).get(buildCallbackUrl(state, '76561198000000222'));
      expect(r.status).toBe(401);
      const sessionsAfter = (await db.select().from(sessions)).length;
      expect(sessionsAfter).toBe(sessionsBefore);
    });

    it('callback с неизвестным state отклоняется', async () => {
      const r = await request(app).get(buildCallbackUrl('not-a-real-state', '76561198000000333'));
      expect(r.status).toBe(400);
    });

    it('повторное использование того же state отклоняется (one-time)', async () => {
      const state = await startFlowAndGetState(app);
      const first = await request(app).get(buildCallbackUrl(state, '76561198000000444'));
      expect(first.status).toBe(302);
      const second = await request(app).get(buildCallbackUrl(state, '76561198000000444'));
      expect(second.status).toBe(400);
    });
  });

  describe('Первый вход', () => {
    it('создаётся запись пользователя со steamId, personaName, avatarUrl из Steam', async () => {
      const steamId = '76561198000000555';
      profileFetcher.profile = {
        steamId,
        personaName: 'first-login',
        avatarUrl: 'http://example/first.jpg',
      };
      const state = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(state, steamId));
      const rows = await db.select().from(users).where(eq(users.steamId, steamId));
      expect(rows.length).toBe(1);
      expect(rows[0]?.name).toBe('first-login');
      expect(rows[0]?.image).toBe('http://example/first.jpg');
    });

    it('создаётся профиль с debtThreshold=0 и onboardingCompleted=false', async () => {
      const steamId = '76561198000000666';
      profileFetcher.profile = {
        steamId,
        personaName: 'profile-init',
        avatarUrl: 'http://example/p.jpg',
      };
      const state = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(state, steamId));
      const userRows = await db.select().from(users).where(eq(users.steamId, steamId));
      const profileRows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userRows[0]!.id));
      expect(profileRows.length).toBe(1);
      expect(Number(profileRows[0]?.debtThreshold)).toBe(0);
      expect(profileRows[0]?.onboardingCompleted).toBe(false);
    });
  });

  describe('Повторный вход', () => {
    it('второй callback с тем же steamId не создаёт второго пользователя', async () => {
      const steamId = '76561198000000777';
      profileFetcher.profile = { steamId, personaName: 'repeat', avatarUrl: 'a' };
      const s1 = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(s1, steamId));
      const s2 = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(s2, steamId));
      const rows = await db.select().from(users).where(eq(users.steamId, steamId));
      expect(rows.length).toBe(1);
    });

    it('persona и avatar обновляются из Steam при каждом callback', async () => {
      const steamId = '76561198000000888';
      profileFetcher.profile = { steamId, personaName: 'old', avatarUrl: 'old-url' };
      const s1 = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(s1, steamId));

      profileFetcher.profile = { steamId, personaName: 'new', avatarUrl: 'new-url' };
      const s2 = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(s2, steamId));

      const rows = await db.select().from(users).where(eq(users.steamId, steamId));
      expect(rows[0]?.name).toBe('new');
      expect(rows[0]?.image).toBe('new-url');
    });

    it('профиль не пересоздаётся', async () => {
      const steamId = '76561198000000999';
      profileFetcher.profile = { steamId, personaName: 'p', avatarUrl: 'p-url' };
      const s1 = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(s1, steamId));
      const userRows = await db.select().from(users).where(eq(users.steamId, steamId));
      const userId = userRows[0]!.id;
      const s2 = await startFlowAndGetState(app);
      await request(app).get(buildCallbackUrl(s2, steamId));
      const profileRows = await db.select().from(profiles).where(eq(profiles.userId, userId));
      expect(profileRows.length).toBe(1);
    });
  });

  describe('Использование сессии', () => {
    const issueToken = async (steamId: string): Promise<string> => {
      profileFetcher.profile = { steamId, personaName: 'session-user', avatarUrl: '' };
      const state = await startFlowAndGetState(app);
      const r = await request(app).get(buildCallbackUrl(state, steamId));
      const target = new URL(r.headers.location!);
      return target.searchParams.get('token')!;
    };

    it('защищённый эндпоинт без Authorization возвращает 401', async () => {
      const r = await request(app).get('/auth/me');
      expect(r.status).toBe(401);
    });

    it('защищённый эндпоинт с валидным Bearer возвращает данные пользователя', async () => {
      const steamId = '76561198000001111';
      const token = await issueToken(steamId);
      const r = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(200);
      expect(r.body.steamId).toBe(steamId);
    });

    it('истёкший Bearer-токен возвращает 401', async () => {
      const steamId = '76561198000001222';
      const token = await issueToken(steamId);
      // Backdate the session to expire it.
      await db
        .update(sessions)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(sessions.token, token));
      const r = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(401);
    });
  });

  describe('Выход', () => {
    const issueToken = async (steamId: string): Promise<string> => {
      profileFetcher.profile = { steamId, personaName: 'signout-user', avatarUrl: '' };
      const state = await startFlowAndGetState(app);
      const r = await request(app).get(buildCallbackUrl(state, steamId));
      const target = new URL(r.headers.location!);
      return target.searchParams.get('token')!;
    };

    it('POST /auth/sign-out с валидным Bearer инвалидирует сессию', async () => {
      const steamId = '76561198000001333';
      const token = await issueToken(steamId);
      const r = await request(app)
        .post('/auth/sign-out')
        .set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(204);
      const remaining = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, token)));
      expect(remaining.length).toBe(0);
    });

    it('запрос с тем же токеном после sign-out возвращает 401', async () => {
      const steamId = '76561198000001444';
      const token = await issueToken(steamId);
      await request(app).post('/auth/sign-out').set('Authorization', `Bearer ${token}`);
      const r = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(401);
    });
  });
});
