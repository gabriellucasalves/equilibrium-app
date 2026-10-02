/**
 * Feature flags Fase 6 — desligar sem quebrar o app.
 * Em runtime, EXPO_PUBLIC_* podem sobrescrever defaults.
 */
function parseFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export const FEATURE_FLAGS = {
  EXTERNAL_SEARCH_ENABLED: parseFlag(
    process.env.EXPO_PUBLIC_EXTERNAL_SEARCH_ENABLED,
    true,
  ),
  LOCATION_FEATURES_ENABLED: parseFlag(
    process.env.EXPO_PUBLIC_LOCATION_FEATURES_ENABLED,
    true,
  ),
  PROMOTIONS_ENABLED: parseFlag(
    process.env.EXPO_PUBLIC_PROMOTIONS_ENABLED,
    true,
  ),
} as const;

export const ASSISTANT_LIMITS = {
  maxToolCallsPerTurn: 5,
  externalSearchTimeoutMs: 8_000,
  externalRateLimitPerMinute: 8,
} as const;
