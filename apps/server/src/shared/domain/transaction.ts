export type Transaction = { type: 'transaction' } | { type: 'no-transaction' };

export const NO_TRANSACTION: Transaction = { type: 'no-transaction' };

export const createTransaction = (): Transaction => ({ type: 'transaction' });
