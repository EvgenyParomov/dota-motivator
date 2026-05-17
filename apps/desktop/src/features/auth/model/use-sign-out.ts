import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export const useSignOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/auth/sign-out', { method: 'POST' }),
    onSuccess: () => qc.clear(),
  });
};
