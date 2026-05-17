import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MinioContainer, type StartedMinioContainer } from '@testcontainers/minio';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { Container } from 'inversify';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import type { AppEnv } from '../../shared/lib/env.js';
import { consoleLogger, type Logger } from '../../shared/lib/logger.js';
import * as schema from '../../shared/adapters/db/schema/index.js';
import { Clock } from '../../shared/application/ports/clock.js';
import { IdGenerator } from '../../shared/application/ports/id-generator.js';
import { TxManager } from '../../shared/application/ports/tx-manager.js';
import { SystemClock } from '../../shared/adapters/system-clock.js';
import { UuidIdGenerator } from '../../shared/adapters/uuid-id-generator.js';
import { DrizzleTxManager } from '../../shared/adapters/drizzle-tx-manager.js';
import { buildMinio, ensureBucket, MinioBucketToken, MinioToken } from '../../shared/adapters/minio.js';
import {
  DbToken,
  EnvToken,
  LoggerToken,
} from '../../app/tokens.js';
import { authMiddleware } from '../../app/auth-middleware.js';
import { httpErrorHandler } from '../../app/http-error.js';
import { SessionResolver } from '../../shared/application/ports/session-resolver.js';
import type { AuthContext } from '@dm/shared';

import { registerAuth } from '../../features/auth/register.js';
import { SteamOpenIdVerifier } from '../../features/auth/application/ports/steam-openid-verifier.js';
import { SteamProfileFetcher } from '../../features/auth/application/ports/steam-profile-fetcher.js';
import type { SteamProfile } from '../../features/auth/domain/steam-profile.js';
import { registerProfile } from '../../features/profile/register.js';
import { registerBalance } from '../../features/balance/register.js';
import { registerLot } from '../../features/lot/register.js';
import { registerLotExecution } from '../../features/lot-execution/register.js';
import { registerMedia } from '../../features/media/register.js';
import { registerMatchTracking } from '../../features/match-tracking/register.js';
import { registerStatistics } from '../../features/statistics/register.js';

import { buildAuthRouter } from '../../features/auth/adapters/http.router.js';
import { buildProfileRouter } from '../../features/profile/adapters/http.router.js';
import { buildBalanceRouter } from '../../features/balance/adapters/http.router.js';
import { buildLotRouter } from '../../features/lot/adapters/http.router.js';
import {
  buildLotExecutionRouter,
  buildExecuteOnLotRouter,
} from '../../features/lot-execution/adapters/http.router.js';
import { buildMediaRouter } from '../../features/media/adapters/http.router.js';
import { buildMatchTrackingRouter } from '../../features/match-tracking/adapters/http.router.js';
import { buildStatisticsRouter } from '../../features/statistics/adapters/http.router.js';

export type TestStack = {
  pg: StartedPostgreSqlContainer;
  minio: StartedMinioContainer;
  app: Express;
  container: Container;
  stop: () => Promise<void>;
};

class FakeSessionResolver extends SessionResolver {
  constructor(private readonly authContextByToken: Map<string, AuthContext>) {
    super();
  }
  override async resolve(headers: Record<string, string | string[] | undefined>): Promise<AuthContext> {
    const raw = headers.authorization;
    const auth = Array.isArray(raw) ? raw[0] : raw;
    if (!auth) return { kind: 'anonymous' };
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (!m || !m[1]) return { kind: 'anonymous' };
    return this.authContextByToken.get(m[1]) ?? { kind: 'anonymous' };
  }
}

class DbSessionResolver extends SessionResolver {
  constructor(
    private readonly db: import('../../shared/adapters/db/connection.js').Db,
    private readonly now: () => Date = () => new Date(),
  ) {
    super();
  }
  override async resolve(headers: Record<string, string | string[] | undefined>): Promise<AuthContext> {
    const raw = headers.authorization;
    const auth = Array.isArray(raw) ? raw[0] : raw;
    if (!auth) return { kind: 'anonymous' };
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (!m || !m[1]) return { kind: 'anonymous' };
    const token = m[1];
    const { sessions } = await import('../../shared/adapters/db/schema/index.js');
    const { eq } = await import('drizzle-orm');
    const rows = await this.db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    const row = rows[0];
    if (!row) return { kind: 'anonymous' };
    if (row.expiresAt.getTime() <= this.now().getTime()) return { kind: 'anonymous' };
    return { kind: 'authenticated', userId: row.userId };
  }
}

export class FakeSteamOpenIdVerifier extends SteamOpenIdVerifier {
  public result = true;
  override async verify(): Promise<boolean> {
    return this.result;
  }
}

export class FakeSteamProfileFetcher extends SteamProfileFetcher {
  public profile: SteamProfile = {
    steamId: '76561198000000000',
    personaName: 'tester',
    avatarUrl: 'http://example/a.jpg',
  };
  override async fetch(steamId: string): Promise<SteamProfile> {
    return { ...this.profile, steamId };
  }
}

export type StartStackOptions = {
  authContextByToken?: Map<string, AuthContext>;
  // When true, bypass FakeSessionResolver and resolve Bearer tokens against
  // the sessions table directly (matches what SessionIssuerService writes).
  useDbSessionResolver?: boolean;
  // When provided, replace the real Steam adapters with controllable fakes.
  steamVerifier?: FakeSteamOpenIdVerifier;
  steamProfileFetcher?: FakeSteamProfileFetcher;
};

export const startTestStack = async (
  optionsOrMap: StartStackOptions | Map<string, AuthContext> = {},
): Promise<TestStack> => {
  const options: StartStackOptions =
    optionsOrMap instanceof Map ? { authContextByToken: optionsOrMap } : optionsOrMap;
  const authContextByToken = options.authContextByToken ?? new Map<string, AuthContext>();
  const pg = await new PostgreSqlContainer('postgres:17-alpine').start();
  const minio = await new MinioContainer('minio/minio:latest').start();

  const databaseUrl = pg.getConnectionUri();
  const sql = postgres(databaseUrl, { max: 5 });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: 'migrations' });

  const env: AppEnv = {
    DATABASE_URL: databaseUrl,
    PORT: 0,
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    BETTER_AUTH_URL: 'http://localhost:4000',
    STEAM_OPENID_REALM: 'http://localhost:4000',
    MINIO_ENDPOINT: minio.getHost(),
    MINIO_PORT: minio.getPort(),
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_BUCKET: 'dm-media',
    CLIENT_CALLBACK_ALLOWLIST: ['http://localhost:5187'],
  };

  const minioClient = buildMinio({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    bucket: env.MINIO_BUCKET,
  });
  await ensureBucket(minioClient, env.MINIO_BUCKET);

  const container = new Container({ defaultScope: 'Singleton' });
  container.bind<AppEnv>(EnvToken).toConstantValue(env);
  container.bind<Logger>(LoggerToken).toConstantValue(consoleLogger);
  container.bind(DbToken).toConstantValue(db);
  container.bind(MinioToken).toConstantValue(minioClient);
  container.bind<string>(MinioBucketToken).toConstantValue(env.MINIO_BUCKET);
  container.bind(Clock).to(SystemClock);
  container.bind(IdGenerator).to(UuidIdGenerator);

  container.bind(DrizzleTxManager).toSelf();
  container.bind(TxManager).toService(DrizzleTxManager);

  registerAuth(container);
  registerProfile(container);
  registerBalance(container);
  registerLot(container);
  registerLotExecution(container);
  registerMedia(container);
  registerMatchTracking(container);
  registerStatistics(container);

  if (options.useDbSessionResolver) {
    container.rebind(SessionResolver).toConstantValue(new DbSessionResolver(db));
  } else {
    // Override real SessionResolver with a fake one driven by the test map.
    container.rebind(SessionResolver).toConstantValue(new FakeSessionResolver(authContextByToken));
  }

  if (options.steamVerifier) {
    container.rebind(SteamOpenIdVerifier).toConstantValue(options.steamVerifier);
  }
  if (options.steamProfileFetcher) {
    container.rebind(SteamProfileFetcher).toConstantValue(options.steamProfileFetcher);
  }

  const app = express();
  app.use(cookieParser());
  app.use(express.json({ limit: '64kb' }));
  app.use(authMiddleware(container));
  app.use('/auth', buildAuthRouter(container));
  app.use('/profile', buildProfileRouter(container));
  app.use('/balance', buildBalanceRouter(container));
  app.use('/lots', buildLotRouter(container));
  app.use('/lots', buildExecuteOnLotRouter(container));
  app.use('/lot-executions', buildLotExecutionRouter(container));
  app.use('/media', buildMediaRouter(container));
  app.use('/match-events', buildMatchTrackingRouter(container));
  app.use('/statistics', buildStatisticsRouter(container));
  app.use(httpErrorHandler);

  return {
    pg,
    minio,
    app,
    container,
    stop: async () => {
      await sql.end({ timeout: 5 });
      await Promise.all([pg.stop(), minio.stop()]);
    },
  };
};
