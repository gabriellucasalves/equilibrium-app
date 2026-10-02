import type { FinancialGoal, GoalInput } from '@/types/goals';

export interface GoalRepository {
  list(): Promise<FinancialGoal[]>;
  create(input: GoalInput): Promise<FinancialGoal>;
  update(id: string, input: Partial<GoalInput>): Promise<FinancialGoal>;
  contribute(id: string, amountCents: number): Promise<FinancialGoal>;
  delete(id: string): Promise<void>;
}
