import { normalizeExternalItem } from '@/features/external/normalize';
import type { ExternalInformationProvider } from '@/features/external/providers/types';
import type {
  ExternalResult,
  ExternalSearchQuery,
  ExternalSearchResponse,
} from '@/features/external/types';

/**
 * Dados locais mockados para DEMO — fontes fictícias mas estruturadas.
 * Nunca usado como se fosse scrape real em produção.
 */
export class MockExternalProvider implements ExternalInformationProvider {
  readonly name = 'mock_external';

  async search(query: ExternalSearchQuery): Promise<ExternalSearchResponse> {
    const started = Date.now();
    const city = query.city || 'Valparaíso de Goiás';
    const state = query.state || 'GO';
    const now = new Date().toISOString();

    const catalog = buildCatalog(city, state, now);
    let results = catalog.filter((r) => matchesKind(r, query));

    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.category ?? '').toLowerCase().includes(q),
      );
    }

    if (query.maxPriceInCents != null) {
      results = results.filter(
        (r) =>
          r.priceInCents == null ||
          r.priceInCents <= (query.maxPriceInCents as number),
      );
    }

    if (query.kind === 'free_activity' || query.maxPriceInCents === 0) {
      results = results.filter(
        (r) => r.priceInCents == null || r.priceInCents === 0,
      );
    }

    if (query.coordinates) {
      results = results
        .map((r) => {
          const n = normalizeExternalItem(
            {
              ...r,
              kind: r.kind,
              title: r.title,
              description: r.description,
              sourceName: r.sourceName,
              sourceUrl: r.sourceUrl,
              location: r.location,
              priceInCents: r.priceInCents,
              coordinates: r.coordinates,
              category: r.category,
              retrievedAt: r.retrievedAt,
            },
            query.coordinates,
          );
          return n;
        })
        .filter((r): r is ExternalResult => Boolean(r));
    }

    return {
      results: results.slice(0, 6),
      provider: this.name,
      cacheHit: false,
      latencyMs: Date.now() - started,
    };
  }
}

function matchesKind(
  item: ExternalResult,
  query: ExternalSearchQuery,
): boolean {
  if (query.kind === 'free_activity') {
    return (
      (item.kind === 'activity' || item.kind === 'place' || item.kind === 'event') &&
      (item.priceInCents == null || item.priceInCents === 0)
    );
  }
  if (query.kind === 'local_activity') {
    return item.kind === 'activity' || item.kind === 'event';
  }
  return item.kind === query.kind || (query.kind === 'place' && item.kind === 'place');
}

function buildCatalog(
  city: string,
  state: string,
  now: string,
): ExternalResult[] {
  const base = [
    {
      kind: 'place' as const,
      title: 'Parque Ecológico Municipal',
      description: 'Parque urbano com trilha e área de picnic.',
      sourceName: `Prefeitura de ${city}`,
      sourceUrl: 'https://www.gov.br/',
      location: `${city}, ${state}`,
      priceInCents: 0,
      coordinates: { lat: -16.066, lng: -47.976 },
      category: 'park',
    },
    {
      kind: 'place' as const,
      title: 'Biblioteca Pública Municipal',
      description: 'Espaço de leitura e Wi-Fi gratuito.',
      sourceName: `Prefeitura de ${city}`,
      sourceUrl: 'https://www.gov.br/pt-br',
      location: `Centro, ${city}`,
      priceInCents: 0,
      coordinates: { lat: -16.07, lng: -47.98 },
      category: 'library',
    },
    {
      kind: 'event' as const,
      title: 'Feira de artesanato no fim de semana',
      description: 'Entrada franca. Sábado pela manhã.',
      sourceName: `Agenda cultural — ${city}`,
      sourceUrl: 'https://www.gov.br/cultura',
      location: `Praça central, ${city}`,
      priceInCents: 0,
      coordinates: { lat: -16.065, lng: -47.975 },
      category: 'cultural_center',
    },
    {
      kind: 'activity' as const,
      title: 'Caminhada no parque ecológico',
      description: 'Trilha leve, ideal para família.',
      sourceName: 'ICMBio',
      sourceUrl: 'https://www.gov.br/icmbio',
      location: `${city} / entorno`,
      priceInCents: 0,
      coordinates: { lat: -16.08, lng: -47.99 },
      category: 'park',
    },
    {
      kind: 'activity' as const,
      title: 'Sessão de cinema popular',
      description: 'Sessão com preço popular no fim de semana.',
      sourceName: 'Cineclube local',
      sourceUrl: 'https://www.gov.br/cultura',
      location: `${city}, ${state}`,
      priceInCents: 2000,
      coordinates: { lat: -16.062, lng: -47.97 },
      category: 'cinema',
    },
    {
      kind: 'promotion' as const,
      title: 'Café torrado 500g',
      description: 'Preço promocional em mercado da região (mock DEMO).',
      sourceName: 'Circular de ofertas (DEMO)',
      sourceUrl: 'https://www.gov.br/',
      location: `Mercado modelo — ${city}`,
      priceInCents: 1799,
      previousPriceInCents: 2190,
      coordinates: { lat: -16.068, lng: -47.977 },
      category: 'cafe',
    },
    {
      kind: 'price' as const,
      title: 'Café espresso',
      description: 'Preço médio consultado em cafeteria da região (DEMO).',
      sourceName: 'Cardápio publicado (DEMO)',
      sourceUrl: 'https://www.gov.br/',
      location: `Cafeteria Centro — ${city}`,
      priceInCents: 899,
      category: 'cafe',
    },
    {
      kind: 'public_service' as const,
      title: 'Centro de atendimento ao cidadão',
      description: 'Serviços municipais e orientação.',
      sourceName: `Prefeitura de ${city}`,
      sourceUrl: 'https://www.gov.br/pt-br',
      location: `${city}, ${state}`,
      priceInCents: 0,
      category: 'public_space',
    },
  ];

  return base
    .map((item) =>
      normalizeExternalItem({ ...item, retrievedAt: now }, null),
    )
    .filter((r): r is ExternalResult => Boolean(r));
}
