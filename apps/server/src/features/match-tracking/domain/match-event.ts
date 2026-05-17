import type { MatchEventId, UserId } from '@dm/shared';

export type MatchEventEntity = {
  id: MatchEventId;
  userId: UserId;
  matchId: string;
  lobbyType: string;
  startedAt: Date | null;
  endedAt: Date;
  counted: boolean;
};

export type CreateMatchEventInput = {
  id: MatchEventId;
  userId: UserId;
  matchId: string;
  lobbyType: string;
  startedAt: Date | null;
  endedAt: Date;
  counted: boolean;
};
