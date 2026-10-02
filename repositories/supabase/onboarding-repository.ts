import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type {
  CompleteOnboardingPayload,
  LocalMigrationStatus,
  MigrationRepository,
  OnboardingRepository,
} from '@/repositories/interfaces/onboarding-repository';
import { isUuid } from '@/repositories/mappers';
import type { Budget, Transaction } from '@/types/finance';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

export class SupabaseOnboardingRepository implements OnboardingRepository {
  async complete(payload: CompleteOnboardingPayload): Promise<void> {
    const client = requireClient();
    const { error } = await client.rpc('complete_onboarding', {
      p_name: payload.name,
      p_monthly_income_cents: payload.monthlyIncomeCents,
      p_income_type: payload.incomeType,
      p_budgets: payload.budgets.map((b) => ({
        category_key: b.categoryKey,
        limit_cents: b.limitCents,
        month: b.month,
        year: b.year,
      })),
      p_transactions: payload.transactions.map((t) => ({
        id: t.id && isUuid(t.id) ? t.id : undefined,
        type: t.type,
        amount_cents: t.amountCents,
        description: t.description,
        category_key: t.categoryKey,
        transaction_date: t.transactionDate,
      })),
    });
    if (error) throw new AppError(error);
  }
}

export class SupabaseMigrationRepository implements MigrationRepository {
  async getStatus(): Promise<LocalMigrationStatus | null> {
    const client = requireClient();
    const { data, error } = await client
      .from('user_migrations')
      .select('local_migration_completed, migration_version')
      .maybeSingle();
    if (error) throw new AppError(error);
    if (!data) return null;
    return {
      localMigrationCompleted: Boolean(data.local_migration_completed),
      migrationVersion: data.migration_version,
    };
  }

  async markCompleted(version = 'v1'): Promise<void> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { error } = await client.from('user_migrations').upsert({
      user_id: uid,
      local_migration_completed: true,
      migration_version: version,
      completed_at: new Date().toISOString(),
    });
    if (error) throw new AppError(error);
  }

  async uploadLocalSnapshot(input: {
    name: string;
    monthlyIncomeCents: number;
    budgets: Budget[];
    transactions: Transaction[];
  }): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const onboarding = new SupabaseOnboardingRepository();
    await onboarding.complete({
      name: input.name,
      monthlyIncomeCents: input.monthlyIncomeCents,
      incomeType: 'fixed',
      budgets: input.budgets.map((b) => ({
        categoryKey: b.categoryKey,
        limitCents: b.limitCents,
        month,
        year,
      })),
      transactions: input.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountCents: t.amountCents,
        description: t.note,
        categoryKey: t.categoryKey,
        transactionDate: t.date,
      })),
    });
    await this.markCompleted('v1');
  }
}
