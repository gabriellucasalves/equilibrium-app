import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  ExpenseDraft,
  OnboardingDraft,
  PrimaryFocus,
  ThemePreference,
} from '@/types/finance';

type OnboardingState = OnboardingDraft & {
  themePreference: ThemePreference;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setThemePreference: (value: ThemePreference) => void;
  setIncomeCents: (cents: number) => void;
  setExpenseStepIndex: (index: number) => void;
  setPrimaryFocus: (focus: PrimaryFocus | null) => void;
  upsertExpense: (expense: ExpenseDraft) => void;
  removeExpense: (key: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  adjustFromSummary: () => void;
};

const initialDraft: OnboardingDraft = {
  incomeCents: 0,
  expenses: [],
  expenseStepIndex: 0,
  completed: false,
  primaryFocus: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialDraft,
      themePreference: 'system',
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setThemePreference: (value) => set({ themePreference: value }),
      setIncomeCents: (cents) => set({ incomeCents: cents }),
      setExpenseStepIndex: (index) => set({ expenseStepIndex: index }),
      setPrimaryFocus: (primaryFocus) => set({ primaryFocus }),
      upsertExpense: (expense) =>
        set((state) => {
          const others = state.expenses.filter((e) => e.key !== expense.key);
          const next =
            expense.amountCents > 0 ? [...others, expense] : others;
          return { expenses: next };
        }),
      removeExpense: (key) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.key !== key),
        })),
      completeOnboarding: () => set({ completed: true }),
      resetOnboarding: () => set({ ...initialDraft }),
      adjustFromSummary: () =>
        set({
          completed: false,
          expenseStepIndex: 0,
        }),
    }),
    {
      name: 'equilibrium-onboarding-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        incomeCents: state.incomeCents,
        expenses: state.expenses,
        expenseStepIndex: state.expenseStepIndex,
        completed: state.completed,
        themePreference: state.themePreference,
        primaryFocus: state.primaryFocus ?? null,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
