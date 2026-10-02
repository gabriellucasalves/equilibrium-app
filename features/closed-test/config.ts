export const CLOSED_TEST_MODE =
  process.env.EXPO_PUBLIC_CLOSED_TEST_MODE === 'true';

export type ClosedTestAccountKey =
  | 'energy'
  | 'water'
  | 'groceries'
  | 'housing'
  | 'transport';

export type ClosedTestAccount = {
  key: ClosedTestAccountKey;
  label: string;
  question: string;
  categoryKey: string;
  note: string;
};

export const CLOSED_TEST_ACCOUNTS: ClosedTestAccount[] = [
  {
    key: 'energy',
    label: 'Luz',
    question: 'Quanto veio sua conta de luz?',
    categoryKey: 'energy',
    note: 'Conta de luz',
  },
  {
    key: 'water',
    label: 'Água',
    question: 'Quanto veio sua conta de água?',
    categoryKey: 'water',
    note: 'Conta de água',
  },
  {
    key: 'groceries',
    label: 'Mercado',
    question: 'Quanto você gastou no mercado?',
    categoryKey: 'groceries',
    note: 'Mercado',
  },
  {
    key: 'housing',
    label: 'Aluguel',
    question: 'Quanto veio o aluguel?',
    categoryKey: 'housing',
    note: 'Aluguel',
  },
  {
    key: 'transport',
    label: 'Combustível',
    question: 'Quanto você gastou com combustível?',
    categoryKey: 'transport',
    note: 'Combustível',
  },
];

export function getClosedTestAccount(
  key: string | string[] | undefined,
): ClosedTestAccount | undefined {
  const value = Array.isArray(key) ? key[0] : key;
  return CLOSED_TEST_ACCOUNTS.find((account) => account.key === value);
}
