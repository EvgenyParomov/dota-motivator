import { inject, injectable } from 'inversify';
import type { StatPeriod, StatisticsResponse, UserId } from '@dm/shared';
import { StatisticsSource } from '../ports/statistics-source.js';
import { Clock } from '../../../../shared/application/ports/clock.js';
import { parsePeriod, rangeForPeriod } from '../../domain/period.js';

@injectable()
export class GetStatisticsUseCase {
  constructor(
    @inject(StatisticsSource) private readonly source: StatisticsSource,
    @inject(Clock) private readonly clock: Clock,
  ) {}

  async execute(
    userId: UserId,
    params: { period: unknown; orphanDays?: number },
  ): Promise<StatisticsResponse> {
    const period: StatPeriod = parsePeriod(params.period);
    const now = this.clock.now();
    const userCreatedAt = await this.source.userCreatedAt(userId);
    const range = rangeForPeriod(period, now, userCreatedAt);
    const orphanDays = params.orphanDays ?? 14;

    const [spheres, topLots, events, heatmap, orphans] = await Promise.all([
      this.source.spheresInRange(userId, range),
      this.source.topLots(userId, range, 10),
      this.source.balanceEvents(userId, range),
      this.source.heatmap(userId, range),
      this.source.orphanSpheres(userId, now, orphanDays),
    ]);

    return {
      period,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      spheres,
      topLots,
      events,
      heatmap,
      orphans,
    };
  }
}
