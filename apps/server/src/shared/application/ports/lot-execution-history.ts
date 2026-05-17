import type { LotId, UserId } from '@dm/shared';

export abstract class LotExecutionHistoryReader {
  abstract listDatesForLot(lotId: LotId, userId: UserId): Promise<Date[]>;
}
