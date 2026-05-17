import type {
  BalanceEventLine,
  HeatmapDay,
  OrphanSphere,
  SphereCount,
  TopLotEntry,
  UserId,
} from '@dm/shared';
import type { StatsRange } from '../../domain/range.js';

export abstract class StatisticsSource {
  abstract spheresInRange(userId: UserId, range: StatsRange): Promise<SphereCount[]>;
  abstract topLots(userId: UserId, range: StatsRange, limit: number): Promise<TopLotEntry[]>;
  abstract balanceEvents(userId: UserId, range: StatsRange): Promise<BalanceEventLine[]>;
  abstract heatmap(userId: UserId, range: StatsRange): Promise<HeatmapDay[]>;
  abstract orphanSpheres(userId: UserId, now: Date, orphanDays: number): Promise<OrphanSphere[]>;
  abstract userCreatedAt(userId: UserId): Promise<Date>;
}
