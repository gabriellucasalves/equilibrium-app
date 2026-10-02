import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEMO_BUDGETS,
  DEMO_PROFILE,
  budgetsFromOnboarding,
  buildDemoTransactions,
  transactionsFromOnboarding,
} from '@/constants/demo';
import { createSupabaseRepositories } from '@/repositories/factory';
import type { TransactionInput } from '@/repositories/interfaces/transaction-repository';
import { AppError, mapErrorToUserMessage } from '@/services/errors/map-error';
import type { Budget, ExpenseDraft, Transaction } from '@/types/finance';
import { currentMonthKey, toISODate } from '@/utils/date';
import { createId } from '@/utils/id';

type FinanceState = {
  displayName: string;
  monthlyIncomeCents: number;
  budgets: Budget[];
  transactions: Transaction[];
  seededFromOnboarding: boolean;
  isDemoMode: boolean;
  syncing: boolean;
  lastSyncError: string | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setDisplayName: (name: string) => void;
  setMonthlyIncomeCents: (cents: number) => void;
  seedFromOnboarding: (input: {
    incomeCents: number;
    expenses: ExpenseDraft[];
    displayName?: string;
  }) => void;
  loadDemoData: () => void;
  clearFinanceData: () => void;
  clearPrivateData: () => void;
  upsertBudget: (budget: Budget) => Promise<void>;
  removeBudget: (key: string) => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<string>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  /** Carrega mês atual do remoto (auth). Não usado em DEMO. */
  hydrateFromRemote: (options?: { demo?: boolean }) => Promise<void>;
  completeOnboardingRemote: (input: {
    name: string;
    incomeCents: number;
    expenses: ExpenseDraft[];
  }) => Promise<void>;
};

const emptyPrivate = {
  displayName: '',
  monthlyIncomeCents: 0,
  budgets: [] as Budget[],
  transactions: [] as Transaction[],
  seededFromOnboarding: false,
  isDemoMode: false,
  syncing: false,
  lastSyncError: null as string | null,
};

function monthYearNow() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...emptyPrivate,
      displayName: 'Gabriel',
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      setDisplayName: (name) => set({ displayName: name.trim() || 'Você' }),

      setMonthlyIncomeCents: (cents) => set({ monthlyIncomeCents: cents }),

      seedFromOnboarding: ({ incomeCents, expenses, displayName }) => {
        if (get().seededFromOnboarding && get().transactions.length > 0) {
          return;
        }
        set({
          displayName: displayName?.trim() || get().displayName || 'Gabriel',
          monthlyIncomeCents: incomeCents,
          budgets: budgetsFromOnboarding(expenses),
          transactions: transactionsFromOnboarding(incomeCents, expenses),
          seededFromOnboarding: true,
          isDemoMode: get().isDemoMode,
        });
      },

      loadDemoData: () => {
        set({
          displayName: DEMO_PROFILE.displayName,
          monthlyIncomeCents: DEMO_PROFILE.monthlyIncomeCents,
          budgets: DEMO_BUDGETS,
          transactions: buildDemoTransactions(),
          seededFromOnboarding: true,
          isDemoMode: true,
          lastSyncError: null,
        });
      },

      clearFinanceData: () =>
        set({
          monthlyIncomeCents: 0,
          budgets: [],
          transactions: [],
          seededFromOnboarding: false,
        }),

      clearPrivateData: () =>
        set({
          ...emptyPrivate,
          displayName: '',
        }),

      hydrateFromRemote: async ({ demo = false } = {}) => {
        if (demo || get().isDemoMode) return;
        const repos = createSupabaseRepositories();
        if (!repos) return;

        set({ syncing: true, lastSyncError: null });
        try {
          const monthKey = currentMonthKey();
          const { month, year } = monthYearNow();
          const [txs, budgets, financial, profile] = await Promise.all([
            repos.transactions.list({ monthKey }),
            repos.budgets.list(month, year),
            repos.financialProfile.get(),
            repos.profile.get(),
          ]);

          set({
            transactions: txs,
            budgets: budgets.map((b) => ({
              categoryKey: b.categoryKey,
              limitCents: b.limitCents,
            })),
            monthlyIncomeCents: financial?.monthlyIncomeCents ?? 0,
            displayName: profile?.name || get().displayName || 'Você',
            seededFromOnboarding: Boolean(profile?.onboardingCompleted),
            isDemoMode: false,
            syncing: false,
          });
        } catch (error) {
          set({
            syncing: false,
            lastSyncError: mapErrorToUserMessage(error),
          });
        }
      },

      completeOnboardingRemote: async ({ name, incomeCents, expenses }) => {
        const repos = createSupabaseRepositories();
        const localSeed = {
          incomeCents,
          expenses,
          displayName: name,
        };
        get().seedFromOnboarding(localSeed);

        if (!repos || get().isDemoMode) return;

        const { month, year } = monthYearNow();
        const budgets = budgetsFromOnboarding(expenses);
        const txs = transactionsFromOnboarding(incomeCents, expenses);

        try {
          await repos.onboarding.complete({
            name,
            monthlyIncomeCents: incomeCents,
            incomeType: 'fixed',
            budgets: budgets.map((b) => ({
              categoryKey: b.categoryKey,
              limitCents: b.limitCents,
              month,
              year,
            })),
            transactions: txs.map((t) => ({
              id: t.id,
              type: t.type,
              amountCents: t.amountCents,
              description: t.note,
              categoryKey: t.categoryKey,
              transactionDate: t.date,
            })),
          });
          await get().hydrateFromRemote();
        } catch (error) {
          // rollback lógico local se remoto falhar
          set({
            seededFromOnboarding: false,
            budgets: [],
            transactions: [],
            monthlyIncomeCents: 0,
            lastSyncError: mapErrorToUserMessage(error),
          });
          throw new AppError(error);
        }
      },

      upsertBudget: async (budget) => {
        const previous = get().budgets;
        set((state) => {
          const others = state.budgets.filter(
            (b) => b.categoryKey !== budget.categoryKey,
          );
          const next = budget.limitCents > 0 ? [...others, budget] : others;
          return { budgets: next, lastSyncError: null };
        });

        if (get().isDemoMode) return;
        const repos = createSupabaseRepositories();
        if (!repos) return;

        const { month, year } = monthYearNow();
        try {
          if (budget.limitCents <= 0) {
            await repos.budgets.delete(budget.categoryKey, month, year);
          } else {
            await repos.budgets.upsert({
              categoryKey: budget.categoryKey,
              limitCents: budget.limitCents,
              month,
              year,
            });
          }
        } catch (error) {
          set({
            budgets: previous,
            lastSyncError: mapErrorToUserMessage(error),
          });
          throw new AppError(error);
        }
      },

      removeBudget: async (categoryKey) => {
        const previous = get().budgets;
        set((state) => ({
          budgets: state.budgets.filter((b) => b.categoryKey !== categoryKey),
        }));
        if (get().isDemoMode) return;
        const repos = createSupabaseRepositories();
        if (!repos) return;
        const { month, year } = monthYearNow();
        try {
          await repos.budgets.delete(categoryKey, month, year);
        } catch (error) {
          set({
            budgets: previous,
            lastSyncError: mapErrorToUserMessage(error),
          });
          throw new AppError(error);
        }
      },

      addTransaction: async (input) => {
        const tempId = createId('tx');
        const stamp = new Date().toISOString();
        const optimistic: Transaction = {
          id: tempId,
          ...input,
          date: input.date || toISODate(),
          createdAt: stamp,
          updatedAt: stamp,
        };
        set((state) => ({
          transactions: [optimistic, ...state.transactions],
          lastSyncError: null,
        }));

        if (get().isDemoMode) return tempId;
        const repos = createSupabaseRepositories();
        if (!repos) return tempId;

        try {
          const saved = await repos.transactions.create(input);
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === tempId ? saved : tx,
            ),
          }));
          return saved.id;
        } catch (error) {
          set((state) => ({
            transactions: state.transactions.filter((tx) => tx.id !== tempId),
            lastSyncError: mapErrorToUserMessage(error),
          }));
          throw new AppError(error);
        }
      },

      updateTransaction: async (id, input) => {
        const previous = get().transactions;
        const stamp = new Date().toISOString();
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  ...input,
                  date: input.date || tx.date,
                  updatedAt: stamp,
                }
              : tx,
          ),
          lastSyncError: null,
        }));

        if (get().isDemoMode) return;
        const repos = createSupabaseRepositories();
        if (!repos) return;

        try {
          const saved = await repos.transactions.update(id, input);
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id ? saved : tx,
            ),
          }));
        } catch (error) {
          set({
            transactions: previous,
            lastSyncError: mapErrorToUserMessage(error),
          });
          throw new AppError(error);
        }
      },

      deleteTransaction: async (id) => {
        const previous = get().transactions;
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
          lastSyncError: null,
        }));

        if (get().isDemoMode) return;
        const repos = createSupabaseRepositories();
        if (!repos) return;

        try {
          await repos.transactions.delete(id);
        } catch (error) {
          set({
            transactions: previous,
            lastSyncError: mapErrorToUserMessage(error),
          });
          throw new AppError(error);
        }
      },
    }),
    {
      name: 'equilibrium-finance-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        displayName: state.displayName,
        monthlyIncomeCents: state.monthlyIncomeCents,
        budgets: state.budgets,
        transactions: state.transactions,
        seededFromOnboarding: state.seededFromOnboarding,
        isDemoMode: state.isDemoMode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
