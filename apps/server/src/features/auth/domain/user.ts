import type { UserId } from '@dm/shared';

export type User = {
  id: UserId;
  steamId: string;
  personaName: string;
  avatarUrl: string;
};
