import { DEMO_BUDGETS, DEMO_PROFILE, buildDemoTransactions } from '@/constants/demo';
import {
  buildBudgetProgress,
  buildMonthSummary,
} from '@/utils/finance-summary';
import { currentMonthKey } from '@/utils/date';

describe('finance summary', () => {
  test('DEMO Gabriel: disponível ~2283', () => {
    const now = new Date('2026-10-15T12:00:00');
    const txs = buildDemoTransactions(now);
    const summary = buildMonthSummary(
      txs,
      currentMonthKey(now),
      DEMO_PROFILE.monthlyIncomeCents,
    );

    expect(summary.incomeCents).toBe(450_000);
    expect(summary.expenseCents).toBe(221_700);
    expect(summary.availableCents).toBe(228_300);
  });

  test('progresso de orçamento mercado', () => {
    const now = new Date('2026-10-15T12:00:00');
    const txs = buildDemoTransactions(now);
    const progress = buildBudgetProgress(
      DEMO_BUDGETS,
      txs,
      currentMonthKey(now),
    );
    const groceries = progress.find((p) => p.categoryKey === 'groceries');
    expect(groceries?.limitCents).toBe(80_000);
    expect(groceries?.spentCents).toBe(80_000);
    expect(groceries?.usagePercent).toBe(100);
  });
});
