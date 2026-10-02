import type { ExternalResult, ExternalSearchQuery } from '@/features/external/types';
import { isCacheFresh } from '@/features/external/ttl';

type CacheEntry = {
  results: ExternalResult[];
  retrievedAt: string;
  kind: string;
};

const memory = new Map<string, CacheEntry>();

export function cacheKey(query: ExternalSearchQuery): string {
  return [
    query.kind,
    query.city.toLowerCase(),
    query.state.toLowerCase(),
    query.query ?? '',
    query.category ?? '',
    query.maxPriceInCents ?? '',
  ].join('|');
}

export function getCached(
  query: ExternalSearchQuery,
): ExternalResult[] | null {
  const key = cacheKey(query);
  const entry = memory.get(key);
  if (!entry) return null;
  const kind = (query.kind === 'free_activity'
    ? 'free_activity'
    : query.kind === 'local_activity'
      ? 'activity'
      : query.kind) as Parameters<typeof isCacheFresh>[1];
  if (!isCacheFresh(entry.retrievedAt, kind)) {
    memory.delete(key);
    return null;
  }
  return entry.results;
}

export function setCache(
  query: ExternalSearchQuery,
  results: ExternalResult[],
): void {
  memory.set(cacheKey(query), {
    results,
    retrievedAt: new Date().toISOString(),
    kind: query.kind,
  });
}

/** Apenas para testes. */
export function clearExternalCache(): void {
  memory.clear();
}
