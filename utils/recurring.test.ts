import {
  advanceAfterPayment,
  computeNextDueDate,
  dueUrgency,
  dueUrgencyLabel,
  effectiveRecurringAmountCents,
} from '@/utils/recurring';
import type { RecurringExpense } from '@/types/recurring';

describe('recurring utils', () => {
  it('usa valor fixo ou estimado', () => {
    expect(
      effectiveRecurringAmountCents({
        amountCents: 12000,
        estimatedAmountCents: null,
      }),
    ).toBe(12_000);
    expect(
      effectiveRecurringAmountCents({
        amountCents: null,
        estimatedAmountCents: 15000,
      }),
    ).toBe(15_000);
  });

  it('calcula próximo vencimento mensal', () => {
    const next = computeNextDueDate({
      frequency: 'monthly',
      dueDay: 10,
      fromDate: new Date('2026-10-05T12:00:00'),
    });
    expect(next).toBe('2026-10-10');

    const after = computeNextDueDate({
      frequency: 'monthly',
      dueDay: 10,
      fromDate: new Date('2026-10-10T12:00:00'),
    });
    expect(after).toBe('2026-11-10');
  });

  it('classifica urgência de vencimento', () => {
    expect(dueUrgency('2026-10-01', '2026-10-01')).toBe('today');
    expect(dueUrgency('2026-10-02', '2026-10-01')).toBe('tomorrow');
    expect(dueUrgency('2026-09-30', '2026-10-01')).toBe('overdue');
    expect(dueUrgencyLabel('tomorrow')).toBe('Vence amanhã');
  });

  it('avança data após pagamento', () => {
    const item: RecurringExpense = {
      id: 'r1',
      name: 'Internet',
      amountCents: 12000,
      estimatedAmountCents: null,
      categoryKey: 'housing',
      frequency: 'monthly',
      dueDay: 10,
      nextDueDate: '2026-10-10',
      paymentMethod: null,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };
    expect(advanceAfterPayment(item)).toBe('2026-11-10');
  });
});
