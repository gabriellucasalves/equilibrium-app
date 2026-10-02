import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NotificationPreferences = {
  dueDates: boolean;
  budgets: boolean;
  goals: boolean;
  weeklySummary: boolean;
  controlinhoTips: boolean;
  preferredHour: number;
  /** Chaves já notificadas — dedupe. */
  sentKeys: string[];
};

type State = NotificationPreferences & {
  setToggle: (
    key: keyof Omit<NotificationPreferences, 'preferredHour' | 'sentKeys'>,
    value: boolean,
  ) => void;
  setPreferredHour: (hour: number) => void;
  markSent: (key: string) => void;
  wasSent: (key: string) => boolean;
};

export const useNotificationPreferencesStore = create<State>()(
  persist(
    (set, get) => ({
      dueDates: true,
      budgets: true,
      goals: true,
      weeklySummary: false,
      controlinhoTips: false,
      preferredHour: 9,
      sentKeys: [],
      setToggle: (key, value) => set({ [key]: value }),
      setPreferredHour: (preferredHour) =>
        set({ preferredHour: Math.min(21, Math.max(8, preferredHour)) }),
      markSent: (key) => {
        const next = [...get().sentKeys.filter((k) => k !== key), key].slice(
          -200,
        );
        set({ sentKeys: next });
      },
      wasSent: (key) => get().sentKeys.includes(key),
    }),
    {
      name: 'equilibrium-notif-prefs-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
