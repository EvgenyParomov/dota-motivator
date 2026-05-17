import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';
import type { StatisticsResponse, StatPeriod } from '@dm/shared';

export const useStatistics = (period: StatPeriod) =>
  useQuery({
    queryKey: ['statistics', period],
    queryFn: () => api<StatisticsResponse>(`/statistics?period=${period}`),
  });
