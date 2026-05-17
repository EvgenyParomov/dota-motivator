import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/adapters/db/schema/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://dm:dm@localhost:5432/dm',
  },
  strict: true,
  verbose: true,
});
