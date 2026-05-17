import { createContext, useContext, type ComponentType } from 'react';

export type BalanceWidgetPort = {
  Widget: ComponentType;
};

export const BalanceWidgetContext = createContext<BalanceWidgetPort | null>(null);

export const useBalanceWidget = (): BalanceWidgetPort => {
  const ctx = useContext(BalanceWidgetContext);
  if (!ctx) throw new Error('BalanceWidgetContext not provided');
  return ctx;
};
