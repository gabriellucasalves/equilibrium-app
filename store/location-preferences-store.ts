import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  LocationMode,
  LocationPreferences,
} from '@/features/location/types';

type State = LocationPreferences & {
  setMode: (mode: LocationMode) => void;
  setManualPlace: (city: string, state: string) => void;
  setInterests: (interests: string[]) => void;
};

export const INTEREST_OPTIONS = [
  'natureza',
  'cinema',
  'cultura',
  'esporte',
  'comida',
  'familia',
] as const;

export const useLocationPreferencesStore = create<State>()(
  persist(
    (set) => ({
      mode: 'disabled',
      manualCity: '',
      manualState: '',
      interests: [],
      setMode: (mode) => set({ mode }),
      setManualPlace: (manualCity, manualState) =>
        set({
          manualCity: manualCity.trim(),
          manualState: manualState.trim().toUpperCase().slice(0, 2),
          mode: 'manual',
        }),
      setInterests: (interests) => set({ interests }),
    }),
    {
      name: 'equilibrium-location-prefs-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
