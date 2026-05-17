import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { BalanceRepository } from '../ports/balance-repository.js';
import type { BalanceEventEntity } from '../../domain/balance-event.js';

@injectable()
export class ListBalanceEventsUseCase {
  constructor(@inject(BalanceRepository) private readonly repo: BalanceRepository) {}

  async execute(
    userId: UserId,
    range?: { from?: Date; to?: Date },
  ): Promise<BalanceEventEntity[]> {
    return this.repo.listEvents(userId, range);
  }
}
