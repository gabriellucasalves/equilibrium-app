import { ONBOARDING_CATEGORIES } from '@/constants/categories';
import { RECEIPT_CATEGORY_OPTIONS } from '@/constants/receipt-categories';
import type {
  Budget,
  BudgetProgress,
  MonthSummary,
  Transaction,
} from '@/types/finance';
import { isSameMonth } from '@/utils/date';
import { availableCents, budgetUsagePercent, sumCents } from '@/utils/money';

export function filterTransactionsByMonth(
  transactions: readonly Transaction[],
  monthKey: string,
): Transaction[] {
  return transactions.filter((tx) => isSameMonth(tx.date, monthKey));
}

export function buildMonthSummary(
  transactions: readonly Transaction[],
  monthKey: string,
  /** Fallback de renda mensal quando não há receitas lançadas. */
  fallbackIncomeCents = 0,
): MonthSummary {
  const monthTx = filterTransactionsByMonth(transactions, monthKey);
  const incomeFromTx = sumCents(
    monthTx.filter((t) => t.type === 'income').map((t) => t.amountCents),
  );
  const expenseCents = sumCents(
    monthTx.filter((t) => t.type === 'expense').map((t) => t.amountCents),
  );
  const incomeCents = incomeFromTx > 0 ? incomeFromTx : fallbackIncomeCents;

  return {
    incomeCents,
    expenseCents,
    availableCents: availableCents(incomeCents, expenseCents),
  };
}

export function categoryLabel(categoryKey: string): string {
  if (categoryKey === 'salary') return 'Salário';
  if (categoryKey === 'other_income') return 'Outra receita';
  if (categoryKey.startsWith('custom_')) {
    return 'Outros';
  }
  const receiptLabel = RECEIPT_CATEGORY_OPTIONS.find(
    (c) => c.key === categoryKey,
  )?.label;
  if (receiptLabel) return receiptLabel;
  return (
    ONBOARDING_CATEGORIES.find((c) => c.key === categoryKey)?.label ?? 'Outros'
  );
}

export function buildBudgetProgress(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  monthKey: string,
): BudgetProgress[] {
  const monthExpenses = filterTransactionsByMonth(transactions, monthKey).filter(
    (t) => t.type === 'expense',
  );

  return budgets
    .filter((b) => b.limitCents > 0)
    .map((budget) => {
      const spentCents = sumCents(
        monthExpenses
          .filter((t) => t.categoryKey === budget.categoryKey)
          .map((t) => t.amountCents),
      );
      return {
        categoryKey: budget.categoryKey,
        label: categoryLabel(budget.categoryKey),
        limitCents: budget.limitCents,
        spentCents,
        remainingCents: budget.limitCents - spentCents,
        usagePercent: budgetUsagePercent(spentCents, budget.limitCents),
      };
    })
    .sort((a, b) => b.usagePercent - a.usagePercent);
}
