import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { BudgetRepository } from '@/repositories/interfaces/budget-repository';
import type {
  FinancialProfileRepository,
  ProfileRepository,
} from '@/repositories/interfaces/financial-profile-repository';
import type {
  MigrationRepository,
  OnboardingRepository,
} from '@/repositories/interfaces/onboarding-repository';
import type { GoalRepository } from '@/repositories/interfaces/goal-repository';
import type { ReceiptRepository } from '@/repositories/interfaces/receipt-repository';
import type { RecurringRepository } from '@/repositories/interfaces/recurring-repository';
import type { TransactionRepository } from '@/repositories/interfaces/transaction-repository';
import { SupabaseBudgetRepository } from '@/repositories/supabase/budget-repository';
import { SupabaseGoalRepository } from '@/repositories/supabase/goal-repository';
import {
  SupabaseMigrationRepository,
  SupabaseOnboardingRepository,
} from '@/repositories/supabase/onboarding-repository';
import {
  SupabaseFinancialProfileRepository,
  SupabaseProfileRepository,
} from '@/repositories/supabase/profile-repository';
import { SupabaseReceiptRepository } from '@/repositories/supabase/receipt-repository';
import { SupabaseRecurringRepository } from '@/repositories/supabase/recurring-repository';
import { SupabaseTransactionRepository } from '@/repositories/supabase/transaction-repository';

export type Repositories = {
  transactions: TransactionRepository;
  budgets: BudgetRepository;
  financialProfile: FinancialProfileRepository;
  profile: ProfileRepository;
  onboarding: OnboardingRepository;
  migration: MigrationRepository;
  receipts: ReceiptRepository;
  goals: GoalRepository;
  recurring: RecurringRepository;
};

/** Em modo autenticado + Supabase configurado. DEMO/local não usa isto. */
export function createSupabaseRepositories(): Repositories | null {
  if (!isSupabaseConfigured()) return null;
  return {
    transactions: new SupabaseTransactionRepository(),
    budgets: new SupabaseBudgetRepository(),
    financialProfile: new SupabaseFinancialProfileRepository(),
    profile: new SupabaseProfileRepository(),
    onboarding: new SupabaseOnboardingRepository(),
    migration: new SupabaseMigrationRepository(),
    receipts: new SupabaseReceiptRepository(),
    goals: new SupabaseGoalRepository(),
    recurring: new SupabaseRecurringRepository(),
  };
}
