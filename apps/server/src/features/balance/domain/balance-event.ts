import type { BalanceEventId, UserId } from '@dm/shared';

export type BalanceEventType = 'credit' | 'debit';
export type BalanceCauseKind = 'lot-execution' | 'match' | 'initial-deposit';

export type BalanceEventEntity = {
  id: BalanceEventId;
  userId: UserId;
  type: BalanceEventType;
  delta: number;
  causeKind: BalanceCauseKind;
  causeId: string | null;
  description: string;
  createdAt: Date;
};

export type NewBalanceEvent = Omit<BalanceEventEntity, 'createdAt'>;
