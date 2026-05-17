import { useEffect } from 'react';
import { useAuthToken } from '../../../shared/ports/auth-token';
import { useMe } from './use-me';

export type AuthSessionStatus = 'anonymous' | 'loading' | 'authenticated' | 'invalid';

export const useAuthSession = (): { status: AuthSessionStatus } => {
  const { token, setToken } = useAuthToken();
  const me = useMe(!!token);

  useEffect(() => {
    if (token && me.isError) setToken(null);
  }, [token, me.isError, setToken]);

  if (!token) return { status: 'anonymous' };
  if (me.isPending) return { status: 'loading' };
  if (me.isError) return { status: 'invalid' };
  return { status: 'authenticated' };
};
