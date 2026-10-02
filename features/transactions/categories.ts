import { ONBOARDING_CATEGORIES } from '@/constants/categories';

export const INCOME_CATEGORIES = [
  { key: 'salary', label: 'Salário' },
  { key: 'other_income', label: 'Outra receita' },
] as const;

export const EXPENSE_CATEGORIES = ONBOARDING_CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
}));

export function categoriesForType(type: 'income' | 'expense') {
  return type === 'income' ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES];
}
