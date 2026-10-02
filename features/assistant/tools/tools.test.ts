import { FinancialToolRegistry } from '@/features/assistant/tools/registry';
import type { FinancialSnapshot } from '@/features/assistant/types';
import { currentMonthKey } from '@/utils/date';

function snapshot(): FinancialSnapshot {
  const month = currentMonthKey();
  return {
    displayName: 'Gabriel',
    monthlyIncomeCents: 450_000,
    monthKey: month,
    budgets: [
      { categoryKey: 'groceries', limitCents: 80_000 },
      { categoryKey: 'leisure', limitCents: 40_000 },
    ],
    receiptItems: [
      {
        normalizedDescription: 'Cafe espresso',
        rawDescription: 'CAFE ESPRESSO',
        totalPriceInCents: 1200,
        categoryKey: 'beverages',
        purchaseDate: `${month}-10`,
      },
    ],
    transactions: [
      {
        id: '1',
        type: 'income',
        amountCents: 450_000,
        categoryKey: 'salary',
        note: 'Salário',
        date: `${month}-01`,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'expense',
        amountCents: 50_000,
        categoryKey: 'groceries',
        note: 'Supermercado ABC',
        date: `${month}-05`,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        type: 'expense',
        amountCents: 15_000,
        categoryKey: 'leisure',
        note: 'Cinema',
        date: `${month}-08`,
        createdAt: '',
        updatedAt: '',
      },
    ],
  };
}

describe('FinancialToolRegistry', () => {
  const registry = new FinancialToolRegistry();
  const snap = snapshot();

  it('resume o mês com centavos corretos', () => {
    const result = registry.run('get_month_summary', snap);
    expect(result.data.expenseCents).toBe(65_000);
    expect(result.data.availableCents).toBe(385_000);
  });

  it('identifica top categoria e merchant', () => {
    const top = registry.run('get_top_categories', snap);
    expect((top.data.categories as { categoryKey: string }[])[0]?.categoryKey).toBe(
      'groceries',
    );
    const merchant = registry.run('get_merchant_spend', snap, {
      merchant: 'Supermercado ABC',
    });
    expect(merchant.data.totalCents).toBe(50_000);
  });

  it('busca keyword em itens de nota', () => {
    const result = registry.run('get_keyword_spend', snap, { keyword: 'cafe' });
    expect(result.data.totalCents).toBe(1200);
  });

  it('lista metas e projeta prazo sem LLM', () => {
    const withGoals: FinancialSnapshot = {
      ...snap,
      goals: [
        {
          id: 'g1',
          name: 'Notebook',
          targetAmountCents: 500_000,
          currentAmountCents: 50_000,
          targetDate: null,
          iconKey: null,
          status: 'active',
          createdAt: '',
          updatedAt: '',
        },
      ],
    };
    const goals = registry.run('get_goals', withGoals);
    expect(goals.summary).toContain('Notebook');
    const progress = registry.run('get_goal_progress', withGoals, {
      name: 'Notebook',
    });
    expect(progress.data.progressPercent).toBe(10);
    const projection = registry.run('calculate_goal_projection', withGoals, {
      name: 'Notebook',
      monthlyContributionCents: 45_000,
    });
    expect(projection.summary).toMatch(/por volta|cerca de/i);
  });

  it('projeta o mês com recorrências', () => {
    const withRec: FinancialSnapshot = {
      ...snap,
      recurring: [
        {
          id: 'r1',
          name: 'Internet',
          amountCents: 12_000,
          estimatedAmountCents: null,
          categoryKey: 'housing',
          frequency: 'monthly',
          dueDay: 20,
          nextDueDate: `${snap.monthKey}-20`,
          paymentMethod: null,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
    };
    const result = registry.run('get_month_projection', withRec);
    expect(result.ok).toBe(true);
    expect(Number(result.data.upcomingRecurringCents)).toBe(12_000);
  });

  it('sinaliza orçamento próximo do limite', () => {
    const tight: FinancialSnapshot = {
      ...snap,
      transactions: [
        ...snap.transactions,
        {
          id: '4',
          type: 'expense',
          amountCents: 25_000,
          categoryKey: 'groceries',
          note: 'Extra',
          date: `${snap.monthKey}-12`,
          createdAt: '',
          updatedAt: '',
        },
      ],
    };
    const budgets = registry.run('get_budget_status', tight);
    expect(Number(budgets.data.alertCount)).toBeGreaterThanOrEqual(1);
  });
});
