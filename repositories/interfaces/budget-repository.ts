import type { Budget } from '@/types/finance';

export type BudgetRecord = Budget & {
  id?: string;
  month: number;
  year: number;
};

export interface BudgetRepository {
  list(month: number, year: number): Promise<BudgetRecord[]>;
  upsert(budget: BudgetRecord): Promise<BudgetRecord>;
  delete(categoryKey: string, month: number, year: number): Promise<void>;
}
