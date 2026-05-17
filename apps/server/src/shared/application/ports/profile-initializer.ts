import type { UserId } from '@dm/shared';

export abstract class ProfileInitializer {
  abstract initialize(userId: UserId): Promise<void>;
}
