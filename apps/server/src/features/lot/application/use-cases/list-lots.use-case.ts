import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { checkRules, type RuleCheck } from '@dm/shared';
import { LotRepository } from '../ports/lot-repository.js';
import type { LotEntity } from '../../domain/lot-entity.js';
import { LotExecutionHistoryReader } from '../../../../shared/application/ports/lot-execution-history.js';
import { MediaUrlResolver } from '../../../../shared/application/ports/media-url-resolver.js';
import { Clock } from '../../../../shared/application/ports/clock.js';

export type LotView = LotEntity & {
  iconUrl: string | null;
  canExecuteNow: RuleCheck;
};

@injectable()
export class ListLotsUseCase {
  constructor(
    @inject(LotRepository) private readonly repo: LotRepository,
    @inject(LotExecutionHistoryReader)
    private readonly history: LotExecutionHistoryReader,
    @inject(MediaUrlResolver) private readonly media: MediaUrlResolver,
    @inject(Clock) private readonly clock: Clock,
  ) {}

  async execute(userId: UserId): Promise<LotView[]> {
    const lots = await this.repo.listActive(userId);
    const now = this.clock.now();
    return Promise.all(
      lots.map(async (lot) => {
        const [history, iconUrl] = await Promise.all([
          this.history.listDatesForLot(lot.id, userId),
          this.media.resolveReadUrl(lot.iconMediaKey),
        ]);
        return {
          ...lot,
          iconUrl,
          canExecuteNow: checkRules(lot.rules, history, now),
        };
      }),
    );
  }
}
