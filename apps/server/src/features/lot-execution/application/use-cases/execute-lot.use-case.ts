import { inject, injectable } from 'inversify';
import type { LotId, UserId } from '@dm/shared';
import { checkRules } from '@dm/shared';
import { LotExecutionRepository } from '../ports/lot-execution-repository.js';
import { LotRepository } from '../../../lot/application/ports/lot-repository.js';
import { BalanceMutator } from '../../../../shared/application/ports/balance-mutator.js';
import { Clock } from '../../../../shared/application/ports/clock.js';
import { IdGenerator } from '../../../../shared/application/ports/id-generator.js';
import { NotFoundError, RuleViolationError } from '../../../../shared/lib/errors.js';
import { LotArchivedError } from '../../domain/errors.js';

@injectable()
export class ExecuteLotUseCase {
  constructor(
    @inject(LotExecutionRepository) private readonly repo: LotExecutionRepository,
    @inject(LotRepository) private readonly lots: LotRepository,
    @inject(BalanceMutator) private readonly balance: BalanceMutator,
    @inject(Clock) private readonly clock: Clock,
    @inject(IdGenerator) private readonly ids: IdGenerator,
  ) {}

  async execute(lotId: LotId, userId: UserId): Promise<{ executionId: string }> {
    const lot = await this.lots.findById(lotId, userId);
    if (!lot) throw new NotFoundError('lot');
    if (!lot.isActive) throw new LotArchivedError();

    const now = this.clock.now();
    const history = await this.repo.listDatesForLot(lotId, userId);
    const decision = checkRules(lot.rules, history, now);
    if (!decision.allowed) throw new RuleViolationError(decision.reason);

    const executionId = this.ids.generate();
    const exec = await this.repo.create({ id: executionId, lotId, userId, createdAt: now });

    try {
      await this.balance.credit(userId, lot.reward, {
        kind: 'lot-execution',
        id: exec.id,
      });
    } catch (e) {
      // Compensating: keep the execution since the rule check passed and the
      // user's UX expectation is "I did the lot". But report error so the
      // caller can retry the credit. For MVP we rethrow.
      throw e;
    }

    return { executionId };
  }
}
