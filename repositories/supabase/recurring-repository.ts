import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type { RecurringRepository } from '@/repositories/interfaces/recurring-repository';
import type { RecurringExpense, RecurringInput } from '@/types/recurring';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

function mapRecurring(row: Record<string, unknown>): RecurringExpense {
  return {
    id: String(row.id),
    name: String(row.name),
    amountCents:
      row.amount_cents === null || row.amount_cents === undefined
        ? null
        : Number(row.amount_cents),
    estimatedAmountCents:
      row.estimated_amount_cents === null ||
      row.estimated_amount_cents === undefined
        ? null
        : Number(row.estimated_amount_cents),
    categoryKey: String(row.category_key),
    frequency: row.frequency as RecurringExpense['frequency'],
    dueDay:
      row.due_day === null || row.due_day === undefined
        ? null
        : Number(row.due_day),
    nextDueDate: String(row.next_due_date),
    paymentMethod: (row.payment_method as string | null) ?? null,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseRecurringRepository implements RecurringRepository {
  async list(): Promise<RecurringExpense[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('recurring_expenses')
      .select('*')
      .order('next_due_date', { ascending: true });
    if (error) throw new AppError(error);
    return (data ?? []).map(mapRecurring);
  }

  async create(input: RecurringInput): Promise<RecurringExpense> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { data, error } = await client
      .from('recurring_expenses')
      .insert({
        user_id: uid,
        name: input.name,
        amount_cents: input.amountCents ?? null,
        estimated_amount_cents: input.estimatedAmountCents ?? null,
        category_key: input.categoryKey,
        frequency: input.frequency,
        due_day: input.dueDay ?? null,
        next_due_date: input.nextDueDate,
        payment_method: input.paymentMethod ?? null,
        is_active: input.isActive ?? true,
      })
      .select('*')
      .single();
    if (error) throw new AppError(error);
    return mapRecurring(data);
  }

  async update(
    id: string,
    input: Partial<RecurringInput>,
  ): Promise<RecurringExpense> {
    const client = requireClient();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.amountCents !== undefined) patch.amount_cents = input.amountCents;
    if (input.estimatedAmountCents !== undefined)
      patch.estimated_amount_cents = input.estimatedAmountCents;
    if (input.categoryKey !== undefined) patch.category_key = input.categoryKey;
    if (input.frequency !== undefined) patch.frequency = input.frequency;
    if (input.dueDay !== undefined) patch.due_day = input.dueDay;
    if (input.nextDueDate !== undefined) patch.next_due_date = input.nextDueDate;
    if (input.paymentMethod !== undefined)
      patch.payment_method = input.paymentMethod;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    const { data, error } = await client
      .from('recurring_expenses')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new AppError(error);
    return mapRecurring(data);
  }

  async delete(id: string): Promise<void> {
    const client = requireClient();
    const { error } = await client
      .from('recurring_expenses')
      .delete()
      .eq('id', id);
    if (error) throw new AppError(error);
  }

  async markPaid(id: string, nextDueDate: string): Promise<RecurringExpense> {
    return this.update(id, { nextDueDate });
  }
}
