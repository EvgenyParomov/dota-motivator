import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { users } from '../../../shared/adapters/db/schema/index.js';
import {
  UserRepository,
  type CreateUserInput,
  type UpdateUserOnLoginInput,
} from '../application/ports/user-repository.js';
import type { User } from '../domain/user.js';

const toUser = (row: typeof users.$inferSelect): User => ({
  id: row.id,
  steamId: row.steamId,
  personaName: row.name,
  avatarUrl: row.image ?? '',
});

@injectable()
export class DrizzleUserRepository extends UserRepository {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async findBySteamId(steamId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.steamId, steamId))
      .limit(1);
    const row = rows[0];
    return row ? toUser(row) : null;
  }

  override async findById(id: UserId): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const row = rows[0];
    return row ? toUser(row) : null;
  }

  override async create(input: CreateUserInput): Promise<User> {
    const inserted = await this.db
      .insert(users)
      .values({
        id: input.id,
        email: `${input.steamId}@steam.local`,
        emailVerified: true,
        name: input.personaName,
        image: input.avatarUrl,
        steamId: input.steamId,
        createdAt: input.now,
        updatedAt: input.now,
        lastLoginAt: input.now,
      })
      .returning();
    return toUser(inserted[0]!);
  }

  override async updateOnLogin(id: UserId, input: UpdateUserOnLoginInput): Promise<void> {
    await this.db
      .update(users)
      .set({
        name: input.personaName,
        image: input.avatarUrl,
        lastLoginAt: input.lastLoginAt,
        updatedAt: input.lastLoginAt,
      })
      .where(eq(users.id, id));
  }
}
