export type LocationMode = 'automatic' | 'manual' | 'disabled';

/** Contexto aproximado — sem lat/lng no LLM. */
export type LocationContext = {
  city: string;
  state: string;
  country: string;
  /** Somente em memória durante busca, se necessário. */
  coordinates?: { lat: number; lng: number } | null;
  source: 'gps' | 'manual' | 'none';
};

export type LocationPreferences = {
  mode: LocationMode;
  manualCity: string;
  manualState: string;
  interests: string[];
};
