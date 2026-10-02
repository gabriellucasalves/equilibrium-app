import type { RecurringExpense } from '@/types/recurring';
import type { Transaction } from '@/types/finance';
import { monthKeyFromDate } from '@/utils/date';
import { buildMonthSummary } from '@/utils/finance-summary';
import { effectiveRecurringAmountCents } from '@/utils/recurring';
import { sumCents } from '@/utils/money';

export type MonthProjection = {
  currentAvailableCents: number;
  upcomingRecurringCents: number;
  projectedAvailableCents: number;
  upcomingCount: number;
};

/** Projeção do mês: disponível atual − contas recorrentes ainda não vencidas/pagas no mês. */
export function getMonthProjection(input: {
  transactions: readonly Transaction[];
  recurring: readonly RecurringExpense[];
  monthKey: string;
  monthlyIncomeCents: number;
  todayISO: string;
}): MonthProjection {
  const summary = buildMonthSummary(
    input.transactions,
    input.monthKey,
    input.monthlyIncomeCents,
  );

  const upcoming = input.recurring.filter((r) => {
    if (!r.isActive) return false;
    if (monthKeyFromDate(r.nextDueDate) !== input.monthKey) return false;
    return r.nextDueDate >= input.todayISO;
  });

  const upcomingRecurringCents = sumCents(
    upcoming.map((r) => effectiveRecurringAmountCents(r)),
  );

  return {
    currentAvailableCents: summary.availableCents,
    upcomingRecurringCents,
    projectedAvailableCents: summary.availableCents - upcomingRecurringCents,
    upcomingCount: upcoming.length,
  };
}
