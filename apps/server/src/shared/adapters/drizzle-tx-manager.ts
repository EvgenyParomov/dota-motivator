import { inject, injectable } from 'inversify';
import { DbToken } from '../../app/tokens.js';
import type { Db } from './db/connection.js';
import { TxManager } from '../application/ports/tx-manager.js';
import {
  createTransaction,
  NO_TRANSACTION,
  type Transaction,
} from '../domain/transaction.js';

@injectable()
export class DrizzleTxManager extends TxManager {
  readonly #transactions = new WeakMap<Transaction, Db>();

  constructor(@inject(DbToken) private readonly rootDb: Db) {
    super();
  }

  override startTransaction<T>(cb: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.rootDb.transaction(async (drizzleTx) => {
      const tx = createTransaction();
      this.#transactions.set(tx, drizzleTx as unknown as Db);
      try {
        return await cb(tx);
      } finally {
        this.#transactions.delete(tx);
      }
    });
  }

  resolve(tx: Transaction = NO_TRANSACTION): Db {
    if (tx.type === 'no-transaction') return this.rootDb;
    const drizzleTx = this.#transactions.get(tx);
    if (!drizzleTx) {
      throw new Error('Transaction not found (already finished or never started here)');
    }
    return drizzleTx;
  }
}
