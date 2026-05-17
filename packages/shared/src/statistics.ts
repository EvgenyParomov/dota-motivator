import type { Sphere } from './sphere.js';

export type StatPeriod = 'week' | 'month' | 'all';

export type SphereCount = { sphere: Sphere; count: number };

export type TopLotEntry = { lotId: string; name: string; sphere: Sphere; count: number };

export type BalanceEventLine = {
  at: string;
  delta: number;
  type: 'lot' | 'match' | 'initial';
  description: string;
};

export type HeatmapDay = { date: string; executions: number; matches: number };

export type OrphanSphere = { sphere: Sphere; daysWithoutActivity: number };

export type StatisticsResponse = {
  period: StatPeriod;
  from: string;
  to: string;
  spheres: SphereCount[];
  topLots: TopLotEntry[];
  events: BalanceEventLine[];
  heatmap: HeatmapDay[];
  orphans: OrphanSphere[];
};
