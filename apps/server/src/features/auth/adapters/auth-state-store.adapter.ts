import { and, eq, gte, isNull } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { authStates } from '../../../shared/adapters/db/schema/index.js';
import { AuthStateStore } from '../application/ports/auth-state-store.js';
import type { AuthState } from '../domain/auth-state.js';

@injectable()
export class DrizzleAuthStateStore extends AuthStateStore {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async save(state: AuthState): Promise<void> {
    await this.db.insert(authStates).values({
      state: state.state,
      clientCallback: state.clientCallback,
      expiresAt: state.expiresAt,
    });
  }

  override async consume(state: string, now: Date): Promise<AuthState | null> {
    const updated = await this.db
      .update(authStates)
      .set({ consumedAt: now })
      .where(
        and(
          eq(authStates.state, state),
          gte(authStates.expiresAt, now),
          isNull(authStates.consumedAt),
        ),
      )
      .returning();
    const row = updated[0];
    if (!row) return null;
    return {
      state: row.state,
      clientCallback: row.clientCallback,
      expiresAt: row.expiresAt,
    };
  }
}
