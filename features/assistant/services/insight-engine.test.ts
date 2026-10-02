import { InsightEngine } from '@/features/assistant/services/insight-engine';
import type { FinancialSnapshot } from '@/features/assistant/types';
import { currentMonthKey, toISODate } from '@/utils/date';

describe('InsightEngine', () => {
  it('gera insights determinísticos sem LLM', () => {
    const month = currentMonthKey();
    const snapshot: FinancialSnapshot = {
      displayName: 'Gabriel',
      monthlyIncomeCents: 450_000,
      monthKey: month,
      budgets: [{ categoryKey: 'groceries', limitCents: 80_000 }],
      receiptItems: [],
      transactions: [
        {
          id: '1',
          type: 'expense',
          amountCents: 70_000,
          categoryKey: 'groceries',
          note: 'Mercado',
          date: `${month}-03`,
          createdAt: '',
          updatedAt: '',
        },
      ],
    };
    const insights = new InsightEngine().generate(snapshot);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((i) => i.id === 'available')).toBe(true);
    expect(insights.some((i) => i.id === 'budget-alert')).toBe(true);
    // alerta de orçamento deve vir antes do disponível na Home
    const budgetIdx = insights.findIndex((i) => i.id === 'budget-alert');
    const availableIdx = insights.findIndex((i) => i.id === 'available');
    expect(budgetIdx).toBeLessThan(availableIdx);
  });

  it('prioriza conta próxima', () => {
    const month = currentMonthKey();
    const snapshot: FinancialSnapshot = {
      displayName: 'Gabriel',
      monthlyIncomeCents: 450_000,
      monthKey: month,
      budgets: [],
      receiptItems: [],
      transactions: [],
      recurring: [
        {
          id: 'r1',
          name: 'Internet',
          amountCents: 12000,
          estimatedAmountCents: null,
          categoryKey: 'housing',
          frequency: 'monthly',
          dueDay: 10,
          nextDueDate: toISODate(),
          paymentMethod: null,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
    };
    const insights = new InsightEngine().generate(snapshot);
    expect(insights[0]?.id).toBe('bill-due');
  });
});
