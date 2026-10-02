import {
  availableCents,
  budgetUsagePercent,
  buildMoneySummary,
  formatCentsToBRL,
  parseBRLToCents,
  percentOf,
  sumCents,
  validatePositiveCents,
} from './money';

describe('money utils', () => {
  test('soma centavos', () => {
    expect(sumCents([100, 250, 50])).toBe(400);
    expect(sumCents([])).toBe(0);
  });

  test('rejeita floating point na soma', () => {
    expect(() => sumCents([10.5])).toThrow();
  });

  test('parse BRL → centavos', () => {
    expect(parseBRLToCents('4500')).toBe(450000);
    expect(parseBRLToCents('4.500,00')).toBe(450000);
    expect(parseBRLToCents('R$ 1.234,56')).toBe(123456);
    expect(parseBRLToCents('12,5')).toBe(1250);
    expect(parseBRLToCents('abc')).toBeNull();
    expect(parseBRLToCents('')).toBeNull();
  });

  test('formata centavos → BRL', () => {
    expect(formatCentsToBRL(450000)).toBe('R$\u00a04.500,00');
    expect(formatCentsToBRL(90)).toBe('R$\u00a00,90');
    expect(formatCentsToBRL(-100)).toBe('-R$\u00a01,00');
  });

  test('disponível do mês', () => {
    expect(availableCents(450000, 221700)).toBe(228300);
  });

  test('percentual e uso de orçamento', () => {
    expect(percentOf(80000, 450000)).toBe(18);
    expect(budgetUsagePercent(40000, 80000)).toBe(50);
    expect(budgetUsagePercent(100, 0)).toBe(100);
  });

  test('resumo onboarding (DEMO Gabriel)', () => {
    const summary = buildMoneySummary(450000, [
      { key: 'groceries', label: 'Mercado', amountCents: 80000, kind: 'variable' },
      { key: 'leisure', label: 'Lazer', amountCents: 40000, kind: 'variable' },
      { key: 'transport', label: 'Transporte', amountCents: 45000, kind: 'variable' },
      { key: 'energy', label: 'Energia', amountCents: 19000, kind: 'fixed' },
      { key: 'water', label: 'Água', amountCents: 9000, kind: 'fixed' },
      { key: 'internet', label: 'Internet', amountCents: 12000, kind: 'fixed' },
    ]);
    expect(summary.fixedCents).toBe(40000);
    expect(summary.variableCents).toBe(165000);
    expect(summary.freeCents).toBe(245000);
    expect(summary.fixedPercent + summary.variablePercent).toBe(
      percentOf(205000, 450000),
    );
  });

  test('validação', () => {
    expect(validatePositiveCents(1)).toBe(true);
    expect(validatePositiveCents(0)).toBe(false);
    expect(validatePositiveCents(1.2)).toBe(false);
  });
});
