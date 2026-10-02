import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type {
  FinancialProfile,
  FinancialProfileRepository,
  ProfileRepository,
  UserProfile,
} from '@/repositories/interfaces/financial-profile-repository';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

export class SupabaseProfileRepository implements ProfileRepository {
  async get(): Promise<UserProfile | null> {
    const client = requireClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client
      .from('profiles')
      .select('name, onboarding_completed')
      .maybeSingle();
    if (error) throw new AppError(error);
    if (!data) return null;
    return {
      name: data.name ?? '',
      onboardingCompleted: Boolean(data.onboarding_completed),
      email: user?.email,
    };
  }

  async updateName(name: string): Promise<void> {
    const client = requireClient();
    const { error } = await client
      .from('profiles')
      .update({ name: name.trim() })
      .eq('user_id', (await client.auth.getUser()).data.user?.id ?? '');
    if (error) throw new AppError(error);
  }

  async setOnboardingCompleted(value: boolean): Promise<void> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { error } = await client
      .from('profiles')
      .update({ onboarding_completed: value })
      .eq('user_id', uid);
    if (error) throw new AppError(error);
  }
}

export class SupabaseFinancialProfileRepository
  implements FinancialProfileRepository
{
  async get(): Promise<FinancialProfile | null> {
    const client = requireClient();
    const { data, error } = await client
      .from('financial_profiles')
      .select('monthly_income_cents, income_type')
      .maybeSingle();
    if (error) throw new AppError(error);
    if (!data) return null;
    return {
      monthlyIncomeCents: Number(data.monthly_income_cents),
      incomeType: data.income_type as 'fixed' | 'variable',
    };
  }

  async save(profile: FinancialProfile): Promise<void> {
    const client = requireClient();
    const uid = (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new AppError('not_authenticated');
    const { error } = await client.from('financial_profiles').upsert({
      user_id: uid,
      monthly_income_cents: profile.monthlyIncomeCents,
      income_type: profile.incomeType,
    });
    if (error) throw new AppError(error);
  }
}
