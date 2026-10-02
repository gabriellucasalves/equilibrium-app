import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createSupabaseRepositories } from '@/repositories/factory';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import type { FinancialGoal, GoalInput } from '@/types/goals';
import { createId } from '@/utils/id';

type GoalsState = {
  goals: FinancialGoal[];
  loading: boolean;
  error: string | null;
  hydrate: (isDemo: boolean) => Promise<void>;
  createGoal: (input: GoalInput, isDemo: boolean) => Promise<void>;
  contribute: (id: string, amountCents: number, isDemo: boolean) => Promise<void>;
  updateGoal: (
    id: string,
    input: Partial<GoalInput>,
    isDemo: boolean,
  ) => Promise<void>;
  removeGoal: (id: string, isDemo: boolean) => Promise<void>;
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      loading: false,
      error: null,

      hydrate: async (isDemo) => {
        if (isDemo) return;
        set({ loading: true, error: null });
        try {
          const repos = createSupabaseRepositories();
          const goals = (await repos?.goals.list()) ?? [];
          set({ goals, loading: false });
        } catch (e) {
          set({ loading: false, error: mapErrorToUserMessage(e) });
        }
      },

      createGoal: async (input, isDemo) => {
        const now = new Date().toISOString();
        if (isDemo) {
          const goal: FinancialGoal = {
            id: createId('goal'),
            name: input.name,
            targetAmountCents: input.targetAmountCents,
            currentAmountCents: input.currentAmountCents ?? 0,
            targetDate: input.targetDate ?? null,
            iconKey: input.iconKey ?? null,
            status: input.status ?? 'active',
            createdAt: now,
            updatedAt: now,
          };
          set({ goals: [goal, ...get().goals] });
          return;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        const created = await repos.goals.create(input);
        set({ goals: [created, ...get().goals] });
      },

      contribute: async (id, amountCents, isDemo) => {
        if (isDemo) {
          set({
            goals: get().goals.map((g) => {
              if (g.id !== id) return g;
              const next = g.currentAmountCents + amountCents;
              return {
                ...g,
                currentAmountCents: next,
                status: next >= g.targetAmountCents ? 'completed' : g.status,
                updatedAt: new Date().toISOString(),
              };
            }),
          });
          return;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        const updated = await repos.goals.contribute(id, amountCents);
        set({
          goals: get().goals.map((g) => (g.id === id ? updated : g)),
        });
      },

      updateGoal: async (id, input, isDemo) => {
        if (isDemo) {
          set({
            goals: get().goals.map((g) =>
              g.id === id
                ? {
                    ...g,
                    ...input,
                    targetAmountCents:
                      input.targetAmountCents ?? g.targetAmountCents,
                    currentAmountCents:
                      input.currentAmountCents ?? g.currentAmountCents,
                    updatedAt: new Date().toISOString(),
                  }
                : g,
            ),
          });
          return;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        const updated = await repos.goals.update(id, input);
        set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) });
      },

      removeGoal: async (id, isDemo) => {
        if (isDemo) {
          set({ goals: get().goals.filter((g) => g.id !== id) });
          return;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        await repos.goals.delete(id);
        set({ goals: get().goals.filter((g) => g.id !== id) });
      },
    }),
    {
      name: 'equilibrium-goals-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ goals: s.goals }),
    },
  ),
);
