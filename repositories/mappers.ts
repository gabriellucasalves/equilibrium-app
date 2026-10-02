import type { Budget, Transaction } from '@/types/finance';

export type RemoteTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount_cents: number;
  description: string;
  category_key: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  receipt_id?: string | null;
};

export type RemoteBudget = {
  id: string;
  category_key: string;
  month: number;
  year: number;
  limit_cents: number;
};

export function toDomainTransaction(row: RemoteTransaction): Transaction {
  return {
    id: row.id,
    type: row.type,
    amountCents: Number(row.amount_cents),
    categoryKey: row.category_key,
    note: row.description ?? '',
    date: row.transaction_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    receiptId: row.receipt_id ?? null,
  };
}

export function toRemoteTransactionInsert(tx: Transaction) {
  return {
    id: isUuid(tx.id) ? tx.id : undefined,
    type: tx.type,
    amount_cents: tx.amountCents,
    description: tx.note,
    category_key: tx.categoryKey,
    transaction_date: tx.date,
  };
}

export function toDomainBudget(row: RemoteBudget): Budget & {
  id: string;
  month: number;
  year: number;
} {
  return {
    id: row.id,
    categoryKey: row.category_key,
    limitCents: Number(row.limit_cents),
    month: row.month,
    year: row.year,
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
