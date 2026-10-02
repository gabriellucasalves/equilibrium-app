import type { Budget, Transaction } from '@/types/finance';

export type CompleteOnboardingPayload = {
  name: string;
  monthlyIncomeCents: number;
  incomeType: 'fixed' | 'variable';
  budgets: {
    categoryKey: string;
    limitCents: number;
    month: number;
    year: number;
  }[];
  transactions: {
    id?: string;
    type: Transaction['type'];
    amountCents: number;
    description: string;
    categoryKey: string;
    transactionDate: string;
  }[];
};

export interface OnboardingRepository {
  complete(payload: CompleteOnboardingPayload): Promise<void>;
}

export type LocalMigrationStatus = {
  localMigrationCompleted: boolean;
  migrationVersion: string;
};

export interface MigrationRepository {
  getStatus(): Promise<LocalMigrationStatus | null>;
  markCompleted(version?: string): Promise<void>;
  uploadLocalSnapshot(input: {
    name: string;
    monthlyIncomeCents: number;
    budgets: Budget[];
    transactions: Transaction[];
  }): Promise<void>;
}
