export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export type RecurringExpense = {
  id: string;
  name: string;
  amountCents: number | null;
  estimatedAmountCents: number | null;
  categoryKey: string;
  frequency: RecurringFrequency;
  dueDay: number | null;
  nextDueDate: string;
  paymentMethod: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecurringInput = {
  name: string;
  amountCents?: number | null;
  estimatedAmountCents?: number | null;
  categoryKey: string;
  frequency: RecurringFrequency;
  dueDay?: number | null;
  nextDueDate: string;
  paymentMethod?: string | null;
  isActive?: boolean;
};

export type DueUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later';
