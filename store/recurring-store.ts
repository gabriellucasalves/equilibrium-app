import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createSupabaseRepositories } from '@/repositories/factory';
import { mapErrorToUserMessage } from '@/services/errors/map-error';
import type { RecurringExpense, RecurringInput } from '@/types/recurring';
import { createId } from '@/utils/id';
import { advanceAfterPayment } from '@/utils/recurring';

type RecurringState = {
  items: RecurringExpense[];
  loading: boolean;
  error: string | null;
  hydrate: (isDemo: boolean) => Promise<void>;
  createItem: (input: RecurringInput, isDemo: boolean) => Promise<string>;
  updateItem: (
    id: string,
    input: Partial<RecurringInput>,
    isDemo: boolean,
  ) => Promise<void>;
  removeItem: (id: string, isDemo: boolean) => Promise<void>;
  dismissThisMonth: (id: string, isDemo: boolean) => Promise<void>;
};

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      hydrate: async (isDemo) => {
        if (isDemo) return;
        set({ loading: true, error: null });
        try {
          const repos = createSupabaseRepositories();
          const items = (await repos?.recurring.list()) ?? [];
          set({ items, loading: false });
        } catch (e) {
          set({ loading: false, error: mapErrorToUserMessage(e) });
        }
      },

      createItem: async (input, isDemo) => {
        const now = new Date().toISOString();
        if (isDemo) {
          const item: RecurringExpense = {
            id: createId('rec'),
            name: input.name,
            amountCents: input.amountCents ?? null,
            estimatedAmountCents: input.estimatedAmountCents ?? null,
            categoryKey: input.categoryKey,
            frequency: input.frequency,
            dueDay: input.dueDay ?? null,
            nextDueDate: input.nextDueDate,
            paymentMethod: input.paymentMethod ?? null,
            isActive: input.isActive ?? true,
            createdAt: now,
            updatedAt: now,
          };
          set({ items: [...get().items, item] });
          return item.id;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        const created = await repos.recurring.create(input);
        set({ items: [...get().items, created] });
        return created.id;
      },

      updateItem: async (id, input, isDemo) => {
        if (isDemo) {
          set({
            items: get().items.map((r) =>
              r.id === id
                ? { ...r, ...input, updatedAt: new Date().toISOString() }
                : r,
            ),
          });
          return;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        const updated = await repos.recurring.update(id, input);
        set({ items: get().items.map((r) => (r.id === id ? updated : r)) });
      },

      removeItem: async (id, isDemo) => {
        if (isDemo) {
          set({ items: get().items.filter((r) => r.id !== id) });
          return;
        }
        const repos = createSupabaseRepositories();
        if (!repos) throw new Error('Supabase não configurado');
        await repos.recurring.delete(id);
        set({ items: get().items.filter((r) => r.id !== id) });
      },

      dismissThisMonth: async (id, isDemo) => {
        const item = get().items.find((r) => r.id === id);
        if (!item) return;
        const next = advanceAfterPayment(item);
        await get().updateItem(id, { nextDueDate: next }, isDemo);
      },
    }),
    {
      name: 'equilibrium-recurring-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
