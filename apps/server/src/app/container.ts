import 'reflect-metadata';
import { Container } from 'inversify';

import { type AppEnv } from '../shared/lib/env.js';
import { consoleLogger, type Logger } from '../shared/lib/logger.js';
import { createDb, type Db, type Sql } from '../shared/adapters/db/connection.js';
import { buildBetterAuth, type Auth } from '../shared/adapters/better-auth.js';
import { buildMinio, ensureBucket } from '../shared/adapters/minio.js';

import { Clock } from '../shared/application/ports/clock.js';
import { IdGenerator } from '../shared/application/ports/id-generator.js';

import { SystemClock } from '../shared/adapters/system-clock.js';
import { UuidIdGenerator } from '../shared/adapters/uuid-id-generator.js';
import { TxManager } from '../shared/application/ports/tx-manager.js';
import { DrizzleTxManager } from '../shared/adapters/drizzle-tx-manager.js';

import {
  AuthToken,
  DbToken,
  SqlToken,
  EnvToken,
  LoggerToken,
  MinioToken,
  MinioBucketToken,
} from './tokens.js';

import { registerAuth } from '../features/auth/register.js';
import { registerProfile } from '../features/profile/register.js';
import { registerBalance } from '../features/balance/register.js';
import { registerLot } from '../features/lot/register.js';
import { registerLotExecution } from '../features/lot-execution/register.js';
import { registerMedia } from '../features/media/register.js';
import { registerMatchTracking } from '../features/match-tracking/register.js';
import { registerStatistics } from '../features/statistics/register.js';

export const buildContainer = async (env: AppEnv): Promise<Container> => {
  const c = new Container({ defaultScope: 'Singleton' });

  c.bind<AppEnv>(EnvToken).toConstantValue(env);
  c.bind<Logger>(LoggerToken).toConstantValue(consoleLogger);

  const { db, sql } = createDb(env.DATABASE_URL);
  c.bind<Db>(DbToken).toConstantValue(db);
  c.bind<Sql>(SqlToken).toConstantValue(sql);

  const auth = buildBetterAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    baseUrl: env.BETTER_AUTH_URL,
  });
  c.bind<Auth>(AuthToken).toConstantValue(auth);

  const minio = buildMinio({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    bucket: env.MINIO_BUCKET,
  });
  await ensureBucket(minio, env.MINIO_BUCKET);
  c.bind(MinioToken).toConstantValue(minio);
  c.bind<string>(MinioBucketToken).toConstantValue(env.MINIO_BUCKET);

  c.bind(Clock).to(SystemClock);
  c.bind(IdGenerator).to(UuidIdGenerator);
  c.bind(DrizzleTxManager).toSelf();
  c.bind(TxManager).toService(DrizzleTxManager);

  registerAuth(c);
  registerProfile(c);
  registerBalance(c);
  registerLot(c);
  registerLotExecution(c);
  registerMedia(c);
  registerMatchTracking(c);
  registerStatistics(c);

  return c;
};
