import { eq, sql } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { DbToken } from '../../../app/tokens.js';
import type { Db } from '../../../shared/adapters/db/connection.js';
import { profiles } from '../../../shared/adapters/db/schema/index.js';
import { ProfileRepository } from '../application/ports/profile-repository.js';
import type { ProfileEntity } from '../domain/profile.js';

@injectable()
export class DrizzleProfileRepository extends ProfileRepository {
  constructor(@inject(DbToken) private readonly db: Db) {
    super();
  }

  override async createIfMissing(userId: UserId): Promise<void> {
    await this.db
      .insert(profiles)
      .values({ userId })
      .onConflictDoNothing({ target: profiles.userId });
  }

  override async findByUserId(userId: UserId): Promise<ProfileEntity | null> {
    const rows = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      userId: row.userId,
      debtThreshold: row.debtThreshold,
      onboardingCompleted: row.onboardingCompleted,
    };
  }

  override async updateDebtThreshold(userId: UserId, debtThreshold: number): Promise<void> {
    await this.db
      .update(profiles)
      .set({ debtThreshold, updatedAt: sql`now()` })
      .where(eq(profiles.userId, userId));
  }

  override async markOnboardingCompleted(userId: UserId): Promise<void> {
    await this.db
      .update(profiles)
      .set({ onboardingCompleted: true, updatedAt: sql`now()` })
      .where(eq(profiles.userId, userId));
  }
}
