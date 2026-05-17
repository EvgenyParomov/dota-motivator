import type { Transaction } from '../../domain/transaction.js';

export abstract class TxManager {
  abstract startTransaction<T>(cb: (tx: Transaction) => Promise<T>): Promise<T>;
}
