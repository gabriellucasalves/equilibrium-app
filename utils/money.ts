import type { ExpenseDraft, MoneySummary } from '@/types/finance';

/** Soma segura de valores em centavos. */
export function sumCents(values: readonly number[]): number {
  return values.reduce((acc, value) => {
    if (!Number.isInteger(value)) {
      throw new Error(`Valor não inteiro em centavos: ${value}`);
    }
    return acc + value;
  }, 0);
}

export function clampNonNegativeCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  return rounded < 0 ? 0 : rounded;
}

/** Converte string BR (1.234,56 ou 1234,56 ou 1234) em centavos. */
export function parseBRLToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [reais, decimals = ''] = normalized.split('.');
  const centsPart = (decimals + '00').slice(0, 2);
  return Number.parseInt(reais, 10) * 100 + Number.parseInt(centsPart, 10);
}

/** Formata centavos como BRL (pt-BR). */
export function formatCentsToBRL(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`Valor não inteiro em centavos: ${cents}`);
  }
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const rest = abs % 100;
  const grouped = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = `R$\u00a0${grouped},${rest.toString().padStart(2, '0')}`;
  return negative ? `-${formatted}` : formatted;
}

/** Percentual inteiro 0–100 a partir de parte/total (centavos). */
export function percentOf(partCents: number, totalCents: number): number {
  if (totalCents <= 0) return 0;
  return Math.round((partCents * 100) / totalCents);
}

export function buildMoneySummary(
  incomeCents: number,
  expenses: readonly ExpenseDraft[],
): MoneySummary {
  const fixedCents = sumCents(
    expenses.filter((e) => e.kind === 'fixed').map((e) => e.amountCents),
  );
  const variableCents = sumCents(
    expenses.filter((e) => e.kind === 'variable').map((e) => e.amountCents),
  );
  const spent = fixedCents + variableCents;
  const freeCents = incomeCents - spent;

  return {
    incomeCents,
    fixedCents,
    variableCents,
    freeCents,
    fixedPercent: percentOf(fixedCents, incomeCents),
    variablePercent: percentOf(variableCents, incomeCents),
    freePercent: percentOf(Math.max(freeCents, 0), incomeCents),
  };
}

/** Disponível do mês = renda − gastos (pode ser negativo). */
export function availableCents(
  incomeCents: number,
  expensesCents: number,
): number {
  return incomeCents - expensesCents;
}

/** Uso de orçamento em % (gasto / limite). */
export function budgetUsagePercent(
  spentCents: number,
  budgetCents: number,
): number {
  if (budgetCents <= 0) return spentCents > 0 ? 100 : 0;
  return Math.min(999, percentOf(spentCents, budgetCents));
}

export function validatePositiveCents(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
