import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

export type Db = ReturnType<typeof drizzle<typeof schema>>;
export type Sql = postgres.Sql;

export const createDb = (databaseUrl: string): { db: Db; sql: Sql } => {
  const sql = postgres(databaseUrl, { max: 10 });
  const db = drizzle(sql, { schema });
  return { db, sql };
};
