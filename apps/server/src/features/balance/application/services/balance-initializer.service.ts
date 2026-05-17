import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { BalanceInitializer } from '../../../../shared/application/ports/balance-initializer.js';
import { BalanceRepository } from '../ports/balance-repository.js';

@injectable()
export class BalanceInitializerService extends BalanceInitializer {
  constructor(@inject(BalanceRepository) private readonly repo: BalanceRepository) {
    super();
  }

  override async initialize(userId: UserId): Promise<void> {
    await this.repo.createIfMissing(userId);
  }
}
