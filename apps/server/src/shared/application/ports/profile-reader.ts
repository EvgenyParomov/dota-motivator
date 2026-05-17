import type { UserId } from '@dm/shared';
import type { ProfileSnapshot } from '../../domain/profile.js';

export abstract class ProfileReader {
  abstract read(userId: UserId): Promise<ProfileSnapshot | null>;
  abstract readDebtThreshold(userId: UserId): Promise<number>;
}
