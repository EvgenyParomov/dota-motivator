export type UserId = string;
export type LotId = string;
export type LotExecutionId = string;
export type MatchEventId = string;
export type BalanceEventId = string;
export type MediaKey = string;

export type AuthContext =
  | { kind: 'authenticated'; userId: UserId }
  | { kind: 'anonymous' };

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
