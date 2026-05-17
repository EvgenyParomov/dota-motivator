import type { LotExecutionId, MatchEventId } from '@dm/shared';

export type BalanceSnapshot = {
  balance: number;
  debtThreshold: number;
  canPlayMore: boolean;
};

export type CreditCause =
  | { kind: 'lot-execution'; id: LotExecutionId }
  | { kind: 'initial-deposit' };

export type DebitCause =
  | { kind: 'match'; id: MatchEventId }
  | { kind: 'initial-deposit' };
