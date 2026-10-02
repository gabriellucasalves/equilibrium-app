import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type { GoalRepository } from '@/repositories/interfaces/goal-repository';
import type { FinancialGoal, GoalInput } from '@/types/goals';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

function mapGoal(row: Record<string, unknown>): FinancialGoal {
  return {
    id: String(row.id),
    name: String(row.name),
    targetAmountCents: Number(row.target_amount_cents),
    currentAmountCents: Number(row.current_amount_cents),
    targetDate: (row.target_date as string | null) ?? null,
    iconKey: (row.icon_key as string | null) ?? null,
    status: row.status as FinancialGoal['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseGoalRepository implements GoalRepository {
  async list(): Promise<FinancialGoal[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('financial_goals')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    if (error) throw new AppError(error);
    return (data ?? []).map(mapGoal);
  }

  async create(input: GoalInput): Promise<FinancialGoal> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { data, error } = await client
      .from('financial_goals')
      .insert({
        user_id: uid,
        name: input.name,
        target_amount_cents: input.targetAmountCents,
        current_amount_cents: input.currentAmountCents ?? 0,
        target_date: input.targetDate ?? null,
        icon_key: input.iconKey ?? null,
        status: input.status ?? 'active',
      })
      .select('*')
      .single();
    if (error) throw new AppError(error);
    return mapGoal(data);
  }

  async update(id: string, input: Partial<GoalInput>): Promise<FinancialGoal> {
    const client = requireClient();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.targetAmountCents !== undefined)
      patch.target_amount_cents = input.targetAmountCents;
    if (input.currentAmountCents !== undefined)
      patch.current_amount_cents = input.currentAmountCents;
    if (input.targetDate !== undefined) patch.target_date = input.targetDate;
    if (input.iconKey !== undefined) patch.icon_key = input.iconKey;
    if (input.status !== undefined) patch.status = input.status;
    const { data, error } = await client
      .from('financial_goals')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new AppError(error);
    return mapGoal(data);
  }

  async contribute(id: string, amountCents: number): Promise<FinancialGoal> {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new AppError('Valor de contribuição inválido');
    }
    const client = requireClient();
    const current = await client
      .from('financial_goals')
      .select('*')
      .eq('id', id)
      .single();
    if (current.error) throw new AppError(current.error);
    const next = Number(current.data.current_amount_cents) + amountCents;
    const target = Number(current.data.target_amount_cents);
    const status = next >= target ? 'completed' : current.data.status;
    const { data, error } = await client
      .from('financial_goals')
      .update({ current_amount_cents: next, status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new AppError(error);
    return mapGoal(data);
  }

  async delete(id: string): Promise<void> {
    const client = requireClient();
    const { error } = await client.from('financial_goals').delete().eq('id', id);
    if (error) throw new AppError(error);
  }
}
