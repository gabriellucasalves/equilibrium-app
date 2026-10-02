import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type {
  ListTransactionsParams,
  TransactionInput,
  TransactionRepository,
} from '@/repositories/interfaces/transaction-repository';
import {
  isUuid,
  toDomainTransaction,
  type RemoteTransaction,
} from '@/repositories/mappers';
import type { Transaction } from '@/types/finance';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

export class SupabaseTransactionRepository implements TransactionRepository {
  async list(params: ListTransactionsParams = {}): Promise<Transaction[]> {
    const client = requireClient();
    let query = client
      .from('transactions')
      .select(
        'id, type, amount_cents, description, category_key, transaction_date, created_at, updated_at, deleted_at, receipt_id',
      )
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false });

    if (params.monthKey) {
      const [y, m] = params.monthKey.split('-');
      const from = `${y}-${m}-01`;
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('transaction_date', from).lte('transaction_date', to);
    }
    if (params.fromDate) query = query.gte('transaction_date', params.fromDate);
    if (params.toDate) query = query.lte('transaction_date', params.toDate);

    const { data, error } = await query;
    if (error) throw new AppError(error);
    return ((data ?? []) as RemoteTransaction[]).map(toDomainTransaction);
  }

  async getById(id: string): Promise<Transaction | null> {
    const client = requireClient();
    const { data, error } = await client
      .from('transactions')
      .select(
        'id, type, amount_cents, description, category_key, transaction_date, created_at, updated_at, deleted_at, receipt_id',
      )
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(error);
    return data ? toDomainTransaction(data as RemoteTransaction) : null;
  }

  async create(input: TransactionInput): Promise<Transaction> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { data, error } = await client
      .from('transactions')
      .insert({
        user_id: uid,
        type: input.type,
        amount_cents: input.amountCents,
        description: input.note,
        category_key: input.categoryKey,
        transaction_date: input.date,
      })
      .select(
        'id, type, amount_cents, description, category_key, transaction_date, created_at, updated_at, deleted_at, receipt_id',
      )
      .single();
    if (error) throw new AppError(error);
    return toDomainTransaction(data as RemoteTransaction);
  }

  async update(id: string, input: TransactionInput): Promise<Transaction> {
    const client = requireClient();
    if (!isUuid(id)) {
      return this.create(input);
    }
    const { data, error } = await client
      .from('transactions')
      .update({
        type: input.type,
        amount_cents: input.amountCents,
        description: input.note,
        category_key: input.categoryKey,
        transaction_date: input.date,
      })
      .eq('id', id)
      .select(
        'id, type, amount_cents, description, category_key, transaction_date, created_at, updated_at, deleted_at, receipt_id',
      )
      .single();
    if (error) throw new AppError(error);
    return toDomainTransaction(data as RemoteTransaction);
  }

  async delete(id: string): Promise<void> {
    const client = requireClient();
    if (!isUuid(id)) return;
    const { error } = await client
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new AppError(error);
  }
}
