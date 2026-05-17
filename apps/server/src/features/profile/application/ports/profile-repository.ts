import type { UserId } from '@dm/shared';
import type { ProfileEntity } from '../../domain/profile.js';

export abstract class ProfileRepository {
  abstract createIfMissing(userId: UserId): Promise<void>;
  abstract findByUserId(userId: UserId): Promise<ProfileEntity | null>;
  abstract updateDebtThreshold(userId: UserId, debtThreshold: number): Promise<void>;
  abstract markOnboardingCompleted(userId: UserId): Promise<void>;
}
