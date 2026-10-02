import type { Budget, Transaction } from '@/types/finance';
import type { FinancialGoal } from '@/types/goals';
import type { RecurringExpense } from '@/types/recurring';

export type ExportPayload = {
  exportedAt: string;
  formatVersion: 1;
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  recurring: RecurringExpense[];
};

/** Pacote JSON estruturado — exportação básica (não é dump jurídico LGPD completo). */
export function buildExportPayload(input: {
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  recurring: RecurringExpense[];
}): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    transactions: input.transactions,
    budgets: input.budgets,
    goals: input.goals,
    recurring: input.recurring,
  };
}

export function exportToJson(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = 'id,type,amount_cents,category_key,note,date';
  const rows = transactions.map((t) =>
    [
      t.id,
      t.type,
      String(t.amountCents),
      t.categoryKey,
      csvEscape(t.note),
      t.date,
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function goalsToCsv(goals: FinancialGoal[]): string {
  const header =
    'id,name,target_amount_cents,current_amount_cents,target_date,status';
  const rows = goals.map((g) =>
    [
      g.id,
      csvEscape(g.name),
      String(g.targetAmountCents),
      String(g.currentAmountCents),
      g.targetDate ?? '',
      g.status,
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function recurringToCsv(items: RecurringExpense[]): string {
  const header =
    'id,name,amount_cents,estimated_amount_cents,category_key,frequency,due_day,next_due_date,is_active';
  const rows = items.map((r) =>
    [
      r.id,
      csvEscape(r.name),
      r.amountCents == null ? '' : String(r.amountCents),
      r.estimatedAmountCents == null ? '' : String(r.estimatedAmountCents),
      r.categoryKey,
      r.frequency,
      r.dueDay == null ? '' : String(r.dueDay),
      r.nextDueDate,
      String(r.isActive),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function budgetsToCsv(budgets: Budget[]): string {
  const header = 'category_key,limit_cents';
  const rows = budgets.map((b) =>
    [b.categoryKey, String(b.limitCents)].join(','),
  );
  return [header, ...rows].join('\n');
}
