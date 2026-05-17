import type { UserId } from '@dm/shared';

export abstract class BalanceInitializer {
  abstract initialize(userId: UserId): Promise<void>;
}
