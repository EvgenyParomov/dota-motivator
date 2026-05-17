import { createContext, useContext } from 'react';

export type AuthTokenContextValue = {
  token: string | null;
  setToken(token: string | null): void;
};

export const AuthTokenContext = createContext<AuthTokenContextValue | null>(null);

export const useAuthToken = (): AuthTokenContextValue => {
  const ctx = useContext(AuthTokenContext);
  if (!ctx) throw new Error('AuthTokenContext not provided');
  return ctx;
};
