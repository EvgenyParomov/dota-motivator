import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export type BalanceEvent = {
  id: string;
  type: 'credit' | 'debit';
  delta: number;
  causeKind: string;
  causeId: string | null;
  description: string;
  createdAt: string;
  lotName: string | null;
};

export const useRecentEvents = (limit = 10) =>
  useQuery({
    queryKey: ['recent-events', limit],
    queryFn: async () => {
      const events = await api<BalanceEvent[]>('/balance/events');
      return events.slice(-limit).reverse();
    },
  });
