import type { LotExecutionId, LotId, UserId } from '@dm/shared';

export type LotExecutionEntity = {
  id: LotExecutionId;
  lotId: LotId;
  userId: UserId;
  createdAt: Date;
};
