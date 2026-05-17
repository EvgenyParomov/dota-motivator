import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export type Profile = {
  userId: string;
  debtThreshold: number;
  onboardingCompleted: boolean;
};

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => api<Profile>('/profile') });

export const useSetDebtThreshold = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (debtThreshold: number) =>
      api<void>('/profile', { method: 'PATCH', body: JSON.stringify({ debtThreshold }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useCompleteOnboarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { debtThreshold: number; startingBalance: number }) =>
      api<void>('/profile/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
};
