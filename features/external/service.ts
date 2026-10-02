import { ASSISTANT_LIMITS, FEATURE_FLAGS } from '@/constants/feature-flags';
import { getCached, setCache } from '@/features/external/cache';
import { logExternalSearch } from '@/features/external/observability';
import { EdgeExternalProvider } from '@/features/external/providers/edge-provider';
import { MockExternalProvider } from '@/features/external/providers/mock-provider';
import type { ExternalInformationProvider } from '@/features/external/providers/types';
import {
  canRunExternalSearch,
  markExternalSearch,
} from '@/features/external/rate-limit';
import type {
  ExternalSearchQuery,
  ExternalSearchResponse,
} from '@/features/external/types';

export class ExternalInformationService {
  constructor(private readonly provider: ExternalInformationProvider) {}

  static createDefault(isDemo: boolean): ExternalInformationService {
    if (isDemo || !FEATURE_FLAGS.EXTERNAL_SEARCH_ENABLED) {
      return new ExternalInformationService(new MockExternalProvider());
    }
    return new ExternalInformationService(new EdgeExternalProvider());
  }

  async search(
    query: ExternalSearchQuery,
    options?: { offline?: boolean },
  ): Promise<ExternalSearchResponse> {
    if (!FEATURE_FLAGS.EXTERNAL_SEARCH_ENABLED && !query.isDemo) {
      return {
        results: [],
        provider: 'disabled',
        cacheHit: false,
        unavailableReason: 'Busca externa desabilitada',
        latencyMs: 0,
      };
    }

    if (
      query.kind === 'promotion' &&
      !FEATURE_FLAGS.PROMOTIONS_ENABLED &&
      !query.isDemo
    ) {
      return {
        results: [],
        provider: 'disabled',
        cacheHit: false,
        unavailableReason: 'Promoções desabilitadas',
        latencyMs: 0,
      };
    }

    if (options?.offline && !query.isDemo) {
      const cached = getCached(query);
      logExternalSearch({
        provider: this.provider.name,
        kind: query.kind,
        latencyMs: 0,
        status: cached ? 'cache' : 'offline',
        resultCount: cached?.length ?? 0,
        cacheHit: Boolean(cached),
      });
      return {
        results: cached ?? [],
        provider: this.provider.name,
        cacheHit: Boolean(cached),
        offline: true,
        unavailableReason: cached
          ? null
          : 'Essa consulta precisa de internet.',
        latencyMs: 0,
      };
    }

    const cached = getCached(query);
    if (cached) {
      logExternalSearch({
        provider: this.provider.name,
        kind: query.kind,
        latencyMs: 0,
        status: 'cache',
        resultCount: cached.length,
        cacheHit: true,
      });
      return {
        results: cached,
        provider: this.provider.name,
        cacheHit: true,
        latencyMs: 0,
      };
    }

    if (!query.isDemo && !canRunExternalSearch()) {
      return {
        results: [],
        provider: this.provider.name,
        cacheHit: false,
        unavailableReason: 'Muitas buscas externas. Tente em instantes.',
        latencyMs: 0,
      };
    }

    if (!query.isDemo) markExternalSearch();

    const response = await withTimeout(
      this.provider.search({ ...query, isDemo: query.isDemo }),
      ASSISTANT_LIMITS.externalSearchTimeoutMs,
    );

    if (response.results.length > 0) {
      setCache(query, response.results);
    }

    logExternalSearch({
      provider: response.provider,
      kind: query.kind,
      latencyMs: response.latencyMs,
      status: response.unavailableReason ? 'unavailable' : 'ok',
      resultCount: response.results.length,
      cacheHit: response.cacheHit,
    });

    return response;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('external_timeout')), ms);
      }),
    ]);
  } catch {
    return {
      results: [],
      provider: 'timeout',
      cacheHit: false,
      unavailableReason: 'A consulta externa demorou demais.',
      latencyMs: ms,
    } as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
