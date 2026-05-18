import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { BalanceMutator } from '../../../../shared/application/ports/balance-mutator.js';
import { TxManager } from '../../../../shared/application/ports/tx-manager.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import type {
  CreditCause,
  DebitCause,
} from '../../../../shared/domain/balance.js';
import { BalanceRepository } from '../ports/balance-repository.js';
import type {
  BalanceEventType,
  NewBalanceEvent,
} from '../../domain/balance-event.js';

const descriptionFor = (cause: CreditCause | DebitCause): string => {
  switch (cause.kind) {
    case 'initial-deposit':
      return 'стартовый баланс';
    case 'lot-execution':
      return 'выполнен лот';
    case 'match':
      return 'сыграна катка';
  }
};

const causeIdOf = (cause: CreditCause | DebitCause): string | null =>
  cause.kind === 'initial-deposit' ? null : cause.id;

@injectable()
export class BalanceMutatorService extends BalanceMutator {
  constructor(
    @inject(BalanceRepository) private readonly repo: BalanceRepository,
    @inject(TxManager) private readonly txManager: TxManager,
    @inject(IdGenerator) private readonly ids: IdGenerator,
  ) {
    super();
  }

  override async credit(userId: UserId, amount: number, cause: CreditCause): Promise<void> {
    await this.txManager.startTransaction(async (tx) => {
      await this.repo.incrementBalance(userId, amount, tx);
      await this.repo.insertEvent(this.buildEvent(userId, amount, 'credit', cause), tx);
    });
  }

  override async debit(userId: UserId, amount: number, cause: DebitCause): Promise<void> {
    await this.txManager.startTransaction(async (tx) => {
      await this.repo.incrementBalance(userId, -amount, tx);
      await this.repo.insertEvent(this.buildEvent(userId, -amount, 'debit', cause), tx);
    });
  }

  private buildEvent(
    userId: UserId,
    delta: number,
    type: BalanceEventType,
    cause: CreditCause | DebitCause,
  ): NewBalanceEvent {
    return {
      id: this.ids.generate(),
      userId,
      type,
      delta,
      causeKind: cause.kind,
      causeId: causeIdOf(cause),
      description: descriptionFor(cause),
    };
  }
}
