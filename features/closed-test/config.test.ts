import {
  CLOSED_TEST_ACCOUNTS,
  getClosedTestAccount,
} from '@/features/closed-test/config';

describe('closed test flow configuration', () => {
  it('keeps the five approved visible accounts only', () => {
    expect(CLOSED_TEST_ACCOUNTS.map((item) => item.label)).toEqual([
      'Luz',
      'Água',
      'Mercado',
      'Aluguel',
      'Combustível',
    ]);
  });

  it('maps visible labels to existing finance categories', () => {
    expect(getClosedTestAccount('energy')?.categoryKey).toBe('energy');
    expect(getClosedTestAccount('water')?.categoryKey).toBe('water');
    expect(getClosedTestAccount('groceries')?.categoryKey).toBe('groceries');
    expect(getClosedTestAccount('housing')?.categoryKey).toBe('housing');
    expect(getClosedTestAccount('transport')?.categoryKey).toBe('transport');
  });

  it('uses the exact QA-approved questions', () => {
    expect(getClosedTestAccount('energy')?.question).toBe(
      'Quanto veio sua conta de luz?',
    );
    expect(getClosedTestAccount('water')?.question).toBe(
      'Quanto veio sua conta de água?',
    );
    expect(getClosedTestAccount('groceries')?.question).toBe(
      'Quanto você gastou no mercado?',
    );
    expect(getClosedTestAccount('housing')?.question).toBe(
      'Quanto veio o aluguel?',
    );
    expect(getClosedTestAccount('transport')?.question).toBe(
      'Quanto você gastou com combustível?',
    );
  });
});
