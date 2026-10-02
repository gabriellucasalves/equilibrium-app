import type { DueUrgency, RecurringExpense, RecurringFrequency } from '@/types/recurring';
import { toISODate } from '@/utils/date';

export function effectiveRecurringAmountCents(
  item: Pick<RecurringExpense, 'amountCents' | 'estimatedAmountCents'>,
): number {
  return item.amountCents ?? item.estimatedAmountCents ?? 0;
}

export function computeNextDueDate(input: {
  frequency: RecurringFrequency;
  dueDay: number | null;
  fromDate?: Date;
}): string {
  const from = input.fromDate ?? new Date();
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (input.frequency === 'weekly') {
    const next = new Date(base);
    next.setDate(next.getDate() + 7);
    return toISODate(next);
  }

  if (input.frequency === 'yearly') {
    const day = input.dueDay ?? base.getDate();
    let year = base.getFullYear() + 1;
    const month = base.getMonth();
    const clamped = clampDay(year, month, day);
    return toISODate(new Date(year, month, clamped));
  }

  // monthly
  const day = input.dueDay ?? base.getDate();
  let year = base.getFullYear();
  let month = base.getMonth();
  const todayDay = base.getDate();
  if (todayDay >= day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const clamped = clampDay(year, month, day);
  return toISODate(new Date(year, month, clamped));
}

function clampDay(year: number, month: number, day: number): number {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day), last);
}

export function dueUrgency(
  nextDueDate: string,
  today = toISODate(),
): DueUrgency {
  if (nextDueDate < today) return 'overdue';
  if (nextDueDate === today) return 'today';
  const t = new Date(`${today}T12:00:00`);
  const n = new Date(`${nextDueDate}T12:00:00`);
  const diffDays = Math.round((n.getTime() - t.getTime()) / 86_400_000);
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 3) return 'soon';
  return 'later';
}

export function dueUrgencyLabel(urgency: DueUrgency): string {
  switch (urgency) {
    case 'overdue':
      return 'Atrasada';
    case 'today':
      return 'Vence hoje';
    case 'tomorrow':
      return 'Vence amanhã';
    case 'soon':
      return 'Vence em breve';
    default:
      return '';
  }
}

/** Avança next_due_date após registrar pagamento (sem criar tx automaticamente). */
export function advanceAfterPayment(item: RecurringExpense): string {
  const current = new Date(`${item.nextDueDate}T12:00:00`);
  return computeNextDueDate({
    frequency: item.frequency,
    dueDay: item.dueDay,
    fromDate: current,
  });
}
