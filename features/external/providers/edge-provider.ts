import { getSupabase } from '@/lib/supabase/client';
import { normalizeExternalItem } from '@/features/external/normalize';
import type { ExternalInformationProvider } from '@/features/external/providers/types';
import type {
  ExternalResult,
  ExternalSearchQuery,
  ExternalSearchResponse,
} from '@/features/external/types';

/**
 * Busca externa via Edge Function — chaves só no servidor.
 * Sem secret/config: retorna unavailable (não inventa resultados).
 */
export class EdgeExternalProvider implements ExternalInformationProvider {
  readonly name = 'edge_external';

  async search(query: ExternalSearchQuery): Promise<ExternalSearchResponse> {
    const started = Date.now();
    const client = getSupabase();
    if (!client) {
      return {
        results: [],
        provider: this.name,
        cacheHit: false,
        unavailableReason: 'Supabase não configurado',
        latencyMs: Date.now() - started,
      };
    }

    try {
      const { data, error } = await client.functions.invoke('external-search', {
        body: {
          kind: query.kind,
          city: query.city,
          state: query.state,
          country: query.country,
          query: query.query,
          category: query.category,
          maxPriceInCents: query.maxPriceInCents,
        },
      });

      if (error) {
        return {
          results: [],
          provider: this.name,
          cacheHit: false,
          unavailableReason: 'Falha na busca externa',
          latencyMs: Date.now() - started,
        };
      }

      if (data?.unavailable) {
        return {
          results: [],
          provider: this.name,
          cacheHit: false,
          unavailableReason:
            data.message ??
            'Busca externa não configurada no servidor',
          latencyMs: Date.now() - started,
        };
      }

      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const results = rawItems
        .map((item: Record<string, unknown>) =>
          normalizeExternalItem(
            {
              kind: (item.kind as ExternalResult['kind']) ?? 'place',
              title: String(item.title ?? ''),
              description: String(item.description ?? ''),
              sourceName: String(item.sourceName ?? ''),
              sourceUrl: String(item.sourceUrl ?? ''),
              location: (item.location as string) ?? null,
              priceInCents:
                item.priceInCents === null || item.priceInCents === undefined
                  ? null
                  : Number(item.priceInCents),
              previousPriceInCents:
                item.previousPriceInCents === null ||
                item.previousPriceInCents === undefined
                  ? null
                  : Number(item.previousPriceInCents),
              validUntil: (item.validUntil as string) ?? null,
              coordinates: (item.coordinates as {
                lat: number;
                lng: number;
              } | null) ?? null,
              category: (item.category as string) ?? null,
              retrievedAt: (item.retrievedAt as string) ?? undefined,
            },
            query.coordinates,
          ),
        )
        .filter((r: ExternalResult | null): r is ExternalResult => Boolean(r));

      return {
        results,
        provider: this.name,
        cacheHit: Boolean(data?.cacheHit),
        latencyMs: Date.now() - started,
      };
    } catch {
      return {
        results: [],
        provider: this.name,
        cacheHit: false,
        unavailableReason: 'Timeout ou erro na busca externa',
        latencyMs: Date.now() - started,
      };
    }
  }
}
