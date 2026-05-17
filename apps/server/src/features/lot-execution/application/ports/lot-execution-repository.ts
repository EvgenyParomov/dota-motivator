import type { LotExecutionId, LotId, UserId } from '@dm/shared';
import type { LotExecutionEntity } from '../../domain/lot-execution.js';

export abstract class LotExecutionRepository {
  abstract create(data: {
    id: LotExecutionId;
    lotId: LotId;
    userId: UserId;
    createdAt: Date;
  }): Promise<LotExecutionEntity>;
  abstract listDatesForLot(lotId: LotId, userId: UserId): Promise<Date[]>;
  abstract listForUser(userId: UserId, filter?: { lotId?: LotId }): Promise<LotExecutionEntity[]>;
}
