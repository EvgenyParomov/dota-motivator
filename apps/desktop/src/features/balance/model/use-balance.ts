import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export type BalanceView = {
  balance: number;
  debtThreshold: number;
  canPlayMore: boolean;
};

export const useBalance = () =>
  useQuery({
    queryKey: ['balance'],
    queryFn: () => api<BalanceView>('/balance'),
  });
