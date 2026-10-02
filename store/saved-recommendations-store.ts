import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AssistantExternalCard } from '@/features/assistant/types';

type State = {
  items: AssistantExternalCard[];
  save: (card: AssistantExternalCard) => void;
  remove: (id: string) => void;
};

export const useSavedRecommendationsStore = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      save: (card) => {
        if (get().items.some((i) => i.id === card.id)) return;
        set({ items: [card, ...get().items].slice(0, 30) });
      },
      remove: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    {
      name: 'equilibrium-saved-recs-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
