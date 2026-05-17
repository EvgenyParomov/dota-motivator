export type BalanceStatus = 'ok' | 'debt' | 'blocked';

export const getBalanceStatus = (balance: number, debtThreshold: number): BalanceStatus => {
  if (balance <= -debtThreshold) return 'blocked';
  if (balance <= 0) return 'debt';
  return 'ok';
};

export const balanceStatusLabel = (status: BalanceStatus): string => {
  switch (status) {
    case 'ok': return 'OK';
    case 'debt': return 'долг';
    case 'blocked': return 'заблокировано';
  }
};
