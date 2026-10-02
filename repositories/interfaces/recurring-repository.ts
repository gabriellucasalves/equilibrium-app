import type { RecurringExpense, RecurringInput } from '@/types/recurring';

export interface RecurringRepository {
  list(): Promise<RecurringExpense[]>;
  create(input: RecurringInput): Promise<RecurringExpense>;
  update(id: string, input: Partial<RecurringInput>): Promise<RecurringExpense>;
  delete(id: string): Promise<void>;
  markPaid(id: string, nextDueDate: string): Promise<RecurringExpense>;
}
