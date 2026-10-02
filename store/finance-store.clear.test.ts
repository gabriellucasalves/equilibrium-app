import { useFinanceStore } from '@/store/finance-store';

describe('finance store privacy', () => {
  test('clearPrivateData remove dados financeiros do cache', () => {
    useFinanceStore.setState({
      displayName: 'Ana',
      monthlyIncomeCents: 1000,
      budgets: [{ categoryKey: 'groceries', limitCents: 100 }],
      transactions: [
        {
          id: '1',
          type: 'expense',
          amountCents: 50,
          categoryKey: 'groceries',
          note: 'x',
          date: '2026-10-01',
          createdAt: '',
          updatedAt: '',
        },
      ],
      seededFromOnboarding: true,
      isDemoMode: false,
    });

    useFinanceStore.getState().clearPrivateData();
    const state = useFinanceStore.getState();
    expect(state.transactions).toEqual([]);
    expect(state.budgets).toEqual([]);
    expect(state.monthlyIncomeCents).toBe(0);
    expect(state.seededFromOnboarding).toBe(false);
    expect(state.isDemoMode).toBe(false);
  });
});
