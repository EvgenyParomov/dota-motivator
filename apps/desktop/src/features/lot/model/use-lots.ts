import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';
import type { LotRule, RuleCheck, Sphere } from '@dm/shared';

export type LotView = {
  id: string;
  name: string;
  sphere: Sphere;
  reward: number;
  rules: LotRule[];
  iconMediaKey: string | null;
  iconUrl: string | null;
  isActive: boolean;
  canExecuteNow: RuleCheck;
};

export const useLots = () =>
  useQuery({ queryKey: ['lots'], queryFn: () => api<LotView[]>('/lots') });

export type LotInput = {
  name: string;
  sphere: Sphere;
  reward: number;
  rules: LotRule[];
  iconMediaKey?: string | null;
};

export const useCreateLot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LotInput) =>
      api<LotView>('/lots', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lots'] }),
  });
};

export const useArchiveLot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/lots/${id}/archive`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lots'] }),
  });
};

export const useExecuteLot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ executionId: string }>(`/lots/${id}/execute`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['lots'] });
      qc.invalidateQueries({ queryKey: ['recent-events'] });
    },
  });
};
