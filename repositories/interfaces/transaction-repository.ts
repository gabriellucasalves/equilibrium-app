import type { Transaction } from '@/types/finance';

export type TransactionInput = {
  type: Transaction['type'];
  amountCents: number;
  categoryKey: string;
  note: string;
  date: string;
};

export type ListTransactionsParams = {
  /** YYYY-MM */
  monthKey?: string;
  fromDate?: string;
  toDate?: string;
};

export interface TransactionRepository {
  list(params?: ListTransactionsParams): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
