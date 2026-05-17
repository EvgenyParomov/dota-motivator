export const applyCredit = (balance: number, amount: number): number => balance + amount;

export const applyDebit = (balance: number, amount: number): number => balance - amount;

export const canPlayMore = (balance: number, debtThreshold: number): boolean =>
  balance > -debtThreshold;
