import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export type BalanceEvent = {
  id: string;
  type: 'credit' | 'debit';
  delta: number;
  causeKind: string;
  description: string;
  createdAt: string;
};

export const useRecentEvents = (limit = 10) =>
  useQuery({
    queryKey: ['recent-events', limit],
    queryFn: async () => {
      const events = await api<BalanceEvent[]>('/balance/events');
      return events.slice(-limit).reverse();
    },
  });
