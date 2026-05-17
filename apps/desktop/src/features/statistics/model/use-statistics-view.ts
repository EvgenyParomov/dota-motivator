import { useState } from 'react';
import type { StatPeriod } from '@dm/shared';
import { useStatistics } from './use-statistics';

export const useStatisticsView = () => {
  const [period, setPeriod] = useState<StatPeriod>('week');
  const stats = useStatistics(period);
  return { period, setPeriod, stats };
};
