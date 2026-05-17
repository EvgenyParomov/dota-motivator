import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../../../shared/lib/api';

export type Me = {
  id: string;
  steamId: string;
  personaName: string;
  avatarUrl: string;
};

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/auth/me'),
    retry: (count, e) => (e instanceof ApiError && e.status === 401 ? false : count < 1),
    enabled,
  });
