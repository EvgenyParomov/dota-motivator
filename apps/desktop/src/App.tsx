import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { buildQueryClient } from './shared/lib/query-client';
import { authStorage } from './shared/lib/auth-storage';
import { AuthTokenContext } from './shared/ports/auth-token';
import { BalanceWidgetContext } from './shared/ports/balance-widget';
import { BalanceWidget } from './features/balance/ui/balance-widget';
import { router } from './app/router';

export const App = () => {
  const queryClient = useMemo(buildQueryClient, []);
  const [token, setTokenState] = useState<string | null>(() => authStorage.get());

  const tokenCtx = useMemo(
    () => ({
      token,
      setToken: (t: string | null) => {
        if (t) authStorage.set(t);
        else authStorage.clear();
        setTokenState(t);
      },
    }),
    [token],
  );

  useEffect(() => {
    const onStorage = () => setTokenState(authStorage.get());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthTokenContext.Provider value={tokenCtx}>
        <BalanceWidgetContext.Provider value={{ Widget: BalanceWidget }}>
          <RouterProvider router={router} />
        </BalanceWidgetContext.Provider>
      </AuthTokenContext.Provider>
    </QueryClientProvider>
  );
};
