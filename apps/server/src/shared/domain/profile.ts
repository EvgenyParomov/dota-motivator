import type { UserId } from '@dm/shared';

export type ProfileSnapshot = {
  userId: UserId;
  debtThreshold: number;
  onboardingCompleted: boolean;
};
