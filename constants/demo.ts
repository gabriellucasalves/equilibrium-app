import type { Budget, ExpenseDraft, Transaction } from '@/types/finance';
import { currentMonthKey, toISODate } from '@/utils/date';
import { createId } from '@/utils/id';

/** Perfil DEMO (brief): Gabriel, renda 4500, disponível ~2283. */
export const DEMO_PROFILE = {
  displayName: 'Gabriel',
  monthlyIncomeCents: 450_000,
} as const;

export const DEMO_BUDGETS: Budget[] = [
  { categoryKey: 'groceries', limitCents: 80_000 },
  { categoryKey: 'leisure', limitCents: 40_000 },
  { categoryKey: 'transport', limitCents: 45_000 },
  { categoryKey: 'energy', limitCents: 19_000 },
  { categoryKey: 'water', limitCents: 9_000 },
  { categoryKey: 'internet', limitCents: 12_000 },
];

/** Gastos DEMO que somam R$ 2.217,00 com a renda 4.500 → disponível 2.283. */
const DEMO_EXPENSE_AMOUNTS: { categoryKey: string; amountCents: number; note: string }[] = [
  { categoryKey: 'groceries', amountCents: 62_400, note: 'Compras da semana' },
  { categoryKey: 'groceries', amountCents: 17_600, note: 'Hortifruti' },
  { categoryKey: 'leisure', amountCents: 28_900, note: 'Cinema e jantar' },
  { categoryKey: 'leisure', amountCents: 11_100, note: 'Streaming' },
  { categoryKey: 'transport', amountCents: 32_500, note: 'Apps de transporte' },
  { categoryKey: 'transport', amountCents: 12_500, note: 'Combustível' },
  { categoryKey: 'energy', amountCents: 19_000, note: 'Conta de luz' },
  { categoryKey: 'water', amountCents: 9_000, note: 'Conta de água' },
  { categoryKey: 'internet', amountCents: 12_000, note: 'Internet fibra' },
  { categoryKey: 'housing', amountCents: 16_700, note: 'Condomínio parcial' },
];

export function buildDemoTransactions(now = new Date()): Transaction[] {
  const month = currentMonthKey(now);
  const day = (n: number) => `${month}-${String(n).padStart(2, '0')}`;
  const stamp = now.toISOString();

  const income: Transaction = {
    id: createId('tx'),
    type: 'income',
    amountCents: DEMO_PROFILE.monthlyIncomeCents,
    categoryKey: 'salary',
    note: 'Salário',
    date: day(5),
    createdAt: stamp,
    updatedAt: stamp,
  };

  const expenses: Transaction[] = DEMO_EXPENSE_AMOUNTS.map((item, index) => ({
    id: createId('tx'),
    type: 'expense' as const,
    amountCents: item.amountCents,
    categoryKey: item.categoryKey,
    note: item.note,
    date: day(Math.min(28, 6 + index * 2)),
    createdAt: stamp,
    updatedAt: stamp,
  }));

  return [income, ...expenses];
}

export function budgetsFromOnboarding(expenses: readonly ExpenseDraft[]): Budget[] {
  return expenses
    .filter((e) => e.amountCents > 0)
    .map((e) => ({
      categoryKey: e.key,
      limitCents: e.amountCents,
    }));
}

export function transactionsFromOnboarding(
  incomeCents: number,
  expenses: readonly ExpenseDraft[],
  now = new Date(),
): Transaction[] {
  const stamp = now.toISOString();
  const today = toISODate(now);
  const list: Transaction[] = [];

  if (incomeCents > 0) {
    list.push({
      id: createId('tx'),
      type: 'income',
      amountCents: incomeCents,
      categoryKey: 'salary',
      note: 'Renda mensal',
      date: today,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }

  for (const expense of expenses) {
    if (expense.amountCents <= 0) continue;
    list.push({
      id: createId('tx'),
      type: 'expense',
      amountCents: expense.amountCents,
      categoryKey: expense.key,
      note: expense.label,
      date: today,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }

  return list;
}
