import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { BalanceReader } from '../../../../shared/application/ports/balance-reader.js';
import type { BalanceSnapshot } from '../../../../shared/domain/balance.js';
import { GetBalanceUseCase } from '../use-cases/get-balance.use-case.js';

@injectable()
export class BalanceReaderService extends BalanceReader {
  constructor(@inject(GetBalanceUseCase) private readonly usecase: GetBalanceUseCase) {
    super();
  }

  override async read(userId: UserId): Promise<BalanceSnapshot> {
    return this.usecase.execute(userId);
  }
}
