import { getMonthProjection } from '@/utils/month-projection';
import type { RecurringExpense } from '@/types/recurring';
import type { Transaction } from '@/types/finance';

describe('getMonthProjection', () => {
  it('projeta disponível após contas previstas', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amountCents: 200_000,
        categoryKey: 'salary',
        note: 'Salário',
        date: '2026-10-01',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'expense',
        amountCents: 60_000,
        categoryKey: 'groceries',
        note: 'Mercado',
        date: '2026-10-05',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const recurring: RecurringExpense[] = [
      {
        id: 'r1',
        name: 'Internet',
        amountCents: 12_000,
        estimatedAmountCents: null,
        categoryKey: 'housing',
        frequency: 'monthly',
        dueDay: 12,
        nextDueDate: '2026-10-12',
        paymentMethod: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'r2',
        name: 'Energia',
        amountCents: 50_000,
        estimatedAmountCents: null,
        categoryKey: 'housing',
        frequency: 'monthly',
        dueDay: 15,
        nextDueDate: '2026-10-15',
        paymentMethod: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const projection = getMonthProjection({
      transactions,
      recurring,
      monthKey: '2026-10',
      monthlyIncomeCents: 200_000,
      todayISO: '2026-10-08',
    });

    // disponível = 200k - 60k = 140k (ou income do mês)
    expect(projection.currentAvailableCents).toBe(140_000);
    expect(projection.upcomingRecurringCents).toBe(62_000);
    expect(projection.projectedAvailableCents).toBe(78_000);
  });
});
