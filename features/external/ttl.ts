import type { ExternalKind } from '@/features/external/types';

/** TTL em ms por tipo de dado externo. */
export const EXTERNAL_CACHE_TTL_MS: Record<ExternalKind | 'free_activity', number> =
  {
    place: 24 * 60 * 60 * 1000,
    activity: 6 * 60 * 60 * 1000,
    free_activity: 6 * 60 * 60 * 1000,
    event: 6 * 60 * 60 * 1000,
    promotion: 30 * 60 * 1000,
    price: 60 * 60 * 1000,
    public_service: 12 * 60 * 60 * 1000,
  };

export function isCacheFresh(
  retrievedAtIso: string,
  kind: keyof typeof EXTERNAL_CACHE_TTL_MS,
  now = Date.now(),
): boolean {
  const ts = Date.parse(retrievedAtIso);
  if (!Number.isFinite(ts)) return false;
  return now - ts <= EXTERNAL_CACHE_TTL_MS[kind];
}
