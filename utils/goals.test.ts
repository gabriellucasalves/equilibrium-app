import { calculateGoalProjection, goalProgressPercent, goalRemainingCents } from '@/utils/goals';
import type { FinancialGoal } from '@/types/goals';

const baseGoal = (overrides: Partial<FinancialGoal> = {}): FinancialGoal => ({
  id: 'g1',
  name: 'Notebook',
  targetAmountCents: 500_000,
  currentAmountCents: 130_000,
  targetDate: null,
  iconKey: null,
  status: 'active',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('goals utils', () => {
  it('calcula progresso e restante', () => {
    const goal = baseGoal();
    expect(goalProgressPercent(goal)).toBe(26);
    expect(goalRemainingCents(goal)).toBe(370_000);
  });

  it('projeta meses de forma determinística', () => {
    const projection = calculateGoalProjection({
      targetAmountCents: 500_000,
      currentAmountCents: 130_000,
      monthlyContributionCents: 40_000,
      fromDate: new Date('2026-10-01T12:00:00'),
    });
    expect(projection.monthsRemaining).toBe(10);
    expect(projection.summary).toMatch(/aproximadamente|cerca de|por volta/i);
    expect(projection.summary).not.toMatch(/exatamente/);
  });

  it('não estima sem contribuição', () => {
    const projection = calculateGoalProjection({
      targetAmountCents: 500_000,
      currentAmountCents: 0,
      monthlyContributionCents: 0,
    });
    expect(projection.monthsRemaining).toBeNull();
  });
});
