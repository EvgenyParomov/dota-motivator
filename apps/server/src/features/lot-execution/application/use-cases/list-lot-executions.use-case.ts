import { inject, injectable } from 'inversify';
import type { LotId, UserId } from '@dm/shared';
import { LotExecutionRepository } from '../ports/lot-execution-repository.js';
import type { LotExecutionEntity } from '../../domain/lot-execution.js';

@injectable()
export class ListLotExecutionsUseCase {
  constructor(@inject(LotExecutionRepository) private readonly repo: LotExecutionRepository) {}

  async execute(userId: UserId, filter?: { lotId?: LotId }): Promise<LotExecutionEntity[]> {
    return this.repo.listForUser(userId, filter);
  }
}
