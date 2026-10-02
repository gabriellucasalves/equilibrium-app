import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type {
  BudgetRecord,
  BudgetRepository,
} from '@/repositories/interfaces/budget-repository';
import { toDomainBudget, type RemoteBudget } from '@/repositories/mappers';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

export class SupabaseBudgetRepository implements BudgetRepository {
  async list(month: number, year: number): Promise<BudgetRecord[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('budgets')
      .select('id, category_key, month, year, limit_cents')
      .eq('month', month)
      .eq('year', year);
    if (error) throw new AppError(error);
    return ((data ?? []) as RemoteBudget[]).map(toDomainBudget);
  }

  async upsert(budget: BudgetRecord): Promise<BudgetRecord> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { data, error } = await client
      .from('budgets')
      .upsert(
        {
          user_id: uid,
          category_key: budget.categoryKey,
          month: budget.month,
          year: budget.year,
          limit_cents: budget.limitCents,
        },
        { onConflict: 'user_id,category_key,month,year' },
      )
      .select('id, category_key, month, year, limit_cents')
      .single();
    if (error) throw new AppError(error);
    return toDomainBudget(data as RemoteBudget);
  }

  async delete(categoryKey: string, month: number, year: number): Promise<void> {
    const client = requireClient();
    const { error } = await client
      .from('budgets')
      .delete()
      .eq('category_key', categoryKey)
      .eq('month', month)
      .eq('year', year);
    if (error) throw new AppError(error);
  }
}
