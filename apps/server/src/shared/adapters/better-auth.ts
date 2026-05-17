import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import type { Db } from './db/connection.js';
import { users, sessions } from './db/schema/index.js';

export const buildBetterAuth = (params: {
  db: Db;
  secret: string;
  baseUrl: string;
}) =>
  betterAuth({
    secret: params.secret,
    baseURL: params.baseUrl,
    database: drizzleAdapter(params.db, {
      provider: 'pg',
      schema: { user: users, session: sessions },
    }),
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    plugins: [bearer()],
  });

export type Auth = ReturnType<typeof buildBetterAuth>;
