import { ONBOARDING_CATEGORIES } from '@/constants/categories';

/** Passos: welcome, income, N categorias, custom, focus, summary */
export const ONBOARDING_TOTAL_STEPS = 2 + ONBOARDING_CATEGORIES.length + 3;

export function stepProgress(stepIndex: number): number {
  return Math.min(1, Math.max(0, stepIndex / (ONBOARDING_TOTAL_STEPS - 1)));
}

export const STEPS = {
  welcome: 0,
  income: 1,
  expensesStart: 2,
  custom: 2 + ONBOARDING_CATEGORIES.length,
  focus: 2 + ONBOARDING_CATEGORIES.length + 1,
  summary: 2 + ONBOARDING_CATEGORIES.length + 2,
} as const;
