import { inject, injectable } from 'inversify';
import type { LotId, UserId } from '@dm/shared';
import { LotExecutionHistoryReader } from '../../../../shared/application/ports/lot-execution-history.js';
import { LotExecutionRepository } from '../ports/lot-execution-repository.js';

@injectable()
export class LotExecutionHistoryService extends LotExecutionHistoryReader {
  constructor(@inject(LotExecutionRepository) private readonly repo: LotExecutionRepository) {
    super();
  }

  override async listDatesForLot(lotId: LotId, userId: UserId): Promise<Date[]> {
    return this.repo.listDatesForLot(lotId, userId);
  }
}
