export type ExternalKind =
  | 'activity'
  | 'place'
  | 'event'
  | 'promotion'
  | 'price'
  | 'public_service';

export type ExternalResult = {
  id: string;
  kind: ExternalKind;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  location?: string | null;
  priceInCents?: number | null;
  previousPriceInCents?: number | null;
  validUntil?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  distanceKm?: number | null;
  category?: string | null;
  /** Texto sanitizado para UI/LLM — nunca como system. */
  externalDataSafe: string;
};

export type ExternalSearchQuery = {
  kind: ExternalKind | 'free_activity' | 'local_activity';
  city: string;
  state: string;
  country: string;
  maxPriceInCents?: number | null;
  query?: string | null;
  category?: string | null;
  dateRange?: string | null;
  interests?: string[];
  coordinates?: { lat: number; lng: number } | null;
  isDemo?: boolean;
};

export type ExternalSearchResponse = {
  results: ExternalResult[];
  provider: string;
  cacheHit: boolean;
  offline?: boolean;
  unavailableReason?: string | null;
  latencyMs: number;
};
