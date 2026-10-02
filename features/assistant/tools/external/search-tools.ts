import type { ExternalInformationService } from '@/features/external/service';
import type { ExternalSearchQuery } from '@/features/external/types';
import type { LocationContext } from '@/features/location/types';
import type { ToolResult } from '@/features/assistant/types';
import { formatCentsToBRL } from '@/utils/money';
import { formatDistanceKm } from '@/features/external/distance';
import { isCacheFresh } from '@/features/external/ttl';

export async function runExternalTool(input: {
  toolName: string;
  service: ExternalInformationService;
  location: LocationContext;
  args?: Record<string, string | number | undefined>;
  interests?: string[];
  offline?: boolean;
  isDemo?: boolean;
  leisureRemainingCents?: number | null;
}): Promise<ToolResult> {
  const maxFromArgs =
    input.args?.maxPriceInCents !== undefined
      ? Number(input.args.maxPriceInCents)
      : undefined;
  const leisureCap =
    input.leisureRemainingCents != null && input.leisureRemainingCents >= 0
      ? input.leisureRemainingCents
      : undefined;
  const maxPriceInCents =
    maxFromArgs !== undefined && Number.isFinite(maxFromArgs)
      ? maxFromArgs
      : leisureCap;

  const kind = mapToolToKind(input.toolName);
  const query: ExternalSearchQuery = {
    kind,
    city: input.location.city,
    state: input.location.state,
    country: input.location.country,
    query: input.args?.query ? String(input.args.query) : null,
    category: input.args?.category ? String(input.args.category) : null,
    maxPriceInCents: maxPriceInCents ?? null,
    interests: input.interests,
    coordinates: input.location.coordinates ?? null,
    isDemo: input.isDemo,
  };

  try {
    const response = await input.service.search(query, {
      offline: input.offline,
    });

    if (response.offline && response.results.length === 0) {
      return {
        toolName: input.toolName,
        ok: false,
        data: { offline: true },
        summary: 'Essa consulta precisa de internet.',
      };
    }

    if (response.unavailableReason && response.results.length === 0) {
      return {
        toolName: input.toolName,
        ok: true,
        data: {
          results: [],
          unavailableReason: response.unavailableReason,
        },
        summary:
          response.unavailableReason.includes('promo')
            ? 'Não encontrei promoções confiáveis para esse item agora.'
            : `Não consegui consultar opções locais agora. ${response.unavailableReason}`,
      };
    }

    const cards = response.results.map((r) => {
      const stale =
        !isCacheFresh(r.retrievedAt, r.kind === 'event' ? 'event' : r.kind);
      return {
        id: r.id,
        kind: r.kind,
        title: r.title,
        description: r.description,
        location: r.location,
        priceInCents: r.priceInCents,
        priceFormatted:
          r.priceInCents == null
            ? 'Preço não informado'
            : r.priceInCents === 0
              ? 'Grátis'
              : formatCentsToBRL(r.priceInCents),
        distanceLabel: formatDistanceKm(r.distanceKm),
        sourceName: r.sourceName,
        sourceUrl: r.sourceUrl,
        retrievedAt: r.retrievedAt,
        validUntil: r.validUntil,
        stale,
        externalDataSafe: r.externalDataSafe,
        withinLeisureBudget:
          leisureCap == null ||
          r.priceInCents == null ||
          r.priceInCents <= leisureCap,
      };
    });

    const withinCount = cards.filter((c) => c.withinLeisureBudget).length;

    return {
      toolName: input.toolName,
      ok: true,
      data: {
        results: cards,
        provider: response.provider,
        cacheHit: response.cacheHit,
        locationLabel: `${input.location.city}, ${input.location.state}`,
        leisureRemainingCents: leisureCap ?? null,
        withinLeisureCount: withinCount,
        EXTERNAL_DATA: cards.map((c) => c.externalDataSafe),
      },
      summary:
        cards.length === 0
          ? 'Não encontrei opções confiáveis com fonte verificável para essa busca.'
          : `Encontrei ${cards.length} opção${cards.length === 1 ? '' : 'ões'}${
              leisureCap != null
                ? ` (priorizei o que cabe nos ${formatCentsToBRL(leisureCap)} de lazer)`
                : ''
            }.`,
    };
  } catch {
    return {
      toolName: input.toolName,
      ok: false,
      data: {},
      summary:
        'Consegui analisar seu orçamento, mas não consegui consultar opções locais agora.',
    };
  }
}

function mapToolToKind(
  toolName: string,
): ExternalSearchQuery['kind'] {
  switch (toolName) {
    case 'search_free_activities':
      return 'free_activity';
    case 'search_local_activities':
      return 'local_activity';
    case 'search_local_places':
      return 'place';
    case 'search_local_events':
      return 'event';
    case 'search_promotions':
      return 'promotion';
    case 'search_product_prices':
      return 'price';
    case 'search_public_services':
      return 'public_service';
    default:
      return 'place';
  }
}

export const EXTERNAL_TOOL_NAMES = [
  'search_free_activities',
  'search_local_activities',
  'search_local_places',
  'search_local_events',
  'search_promotions',
  'search_product_prices',
  'search_public_services',
] as const;

export function isExternalTool(name: string): boolean {
  return (EXTERNAL_TOOL_NAMES as readonly string[]).includes(name);
}
