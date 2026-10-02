export type ExpenseKind = 'fixed' | 'variable';

export type ExpenseDraft = {
  key: string;
  label: string;
  amountCents: number;
  kind: ExpenseKind;
};

/** Preferência de foco — não altera dados financeiros automaticamente. */
export type PrimaryFocus =
  | 'control_spending'
  | 'save_money'
  | 'organize_bills'
  | 'build_reserve'
  | 'understand_money';

export type OnboardingDraft = {
  incomeCents: number;
  expenses: ExpenseDraft[];
  /** Índice da categoria padrão em andamento (0..n). */
  expenseStepIndex: number;
  completed: boolean;
  /** Objetivo principal opcional (personaliza Home/Controlinho). */
  primaryFocus?: PrimaryFocus | null;
};

export type MoneySummary = {
  incomeCents: number;
  fixedCents: number;
  variableCents: number;
  freeCents: number;
  fixedPercent: number;
  variablePercent: number;
  freePercent: number;
};

export type ThemePreference = 'light' | 'dark' | 'system';

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  amountCents: number;
  categoryKey: string;
  note: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  createdAt: string;
  updatedAt: string;
  receiptId?: string | null;
};

export type Budget = {
  categoryKey: string;
  limitCents: number;
};

export type MonthSummary = {
  incomeCents: number;
  expenseCents: number;
  availableCents: number;
};

export type BudgetProgress = {
  categoryKey: string;
  label: string;
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  usagePercent: number;
};
