import { ValidationError } from '../../../shared/lib/errors.js';

export type MatchPhase = 'pre_game' | 'game_in_progress' | 'post_game';

export type GsiMatchEvent = {
  matchId: string;
  phase: MatchPhase;
  lobbyType: string;
  startedAt?: Date;
  endedAt?: Date;
};

export const PRACTICE_LOBBY_TYPES = new Set([
  'DOTA_lobby_type_practice',
  'practice',
  'demo',
  'tutorial',
]);

export const isCountableLobby = (lobbyType: string): boolean =>
  !PRACTICE_LOBBY_TYPES.has(lobbyType);

const PHASES: ReadonlySet<MatchPhase> = new Set(['pre_game', 'game_in_progress', 'post_game']);

export const parseGsiMatchEvent = (raw: {
  matchId?: string;
  phase?: string;
  lobbyType?: string;
  startedAt?: string;
  endedAt?: string;
}): GsiMatchEvent => {
  const matchId = (raw.matchId ?? '').trim();
  if (!matchId) throw new ValidationError('matchId required');
  if (!raw.phase || !PHASES.has(raw.phase as MatchPhase)) {
    throw new ValidationError(`unknown phase: ${raw.phase}`);
  }
  return {
    matchId,
    phase: raw.phase as MatchPhase,
    lobbyType: raw.lobbyType ?? 'unknown',
    startedAt: raw.startedAt ? new Date(raw.startedAt) : undefined,
    endedAt: raw.endedAt ? new Date(raw.endedAt) : undefined,
  };
};
