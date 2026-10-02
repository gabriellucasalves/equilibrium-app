import { clearExternalCache, getCached, setCache } from '@/features/external/cache';
import { isCacheFresh } from '@/features/external/ttl';
import type { ExternalResult } from '@/features/external/types';

describe('cache TTL', () => {
  beforeEach(() => clearExternalCache());

  it('expira cache velho', () => {
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(isCacheFresh(old, 'promotion')).toBe(false);
    expect(isCacheFresh(new Date().toISOString(), 'place')).toBe(true);
  });

  it('getCached respeita frescor', () => {
    const query = {
      kind: 'promotion' as const,
      city: 'X',
      state: 'GO',
      country: 'BR',
    };
    const result = {
      id: '1',
      kind: 'promotion',
      title: 'A',
      description: '',
      sourceName: 'S',
      sourceUrl: 'https://example.com',
      retrievedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      externalDataSafe: '',
    } as ExternalResult;
    setCache(query, [result]);
    // entry retrievedAt is "now" inside setCache — should be fresh
    expect(getCached(query)?.length).toBe(1);
  });
});
