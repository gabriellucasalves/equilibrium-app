import { MockExternalProvider } from '@/features/external/providers/mock-provider';
import { ExternalInformationService } from '@/features/external/service';
import { clearExternalCache } from '@/features/external/cache';

describe('MockExternalProvider + service', () => {
  beforeEach(() => clearExternalCache());

  it('retorna atividades gratuitas com fonte', async () => {
    const provider = new MockExternalProvider();
    const res = await provider.search({
      kind: 'free_activity',
      city: 'Valparaíso de Goiás',
      state: 'GO',
      country: 'BR',
      isDemo: true,
      maxPriceInCents: 0,
    });
    expect(res.results.length).toBeGreaterThan(0);
    for (const r of res.results) {
      expect(r.sourceUrl).toMatch(/^https?:\/\//);
      expect(r.sourceName).toBeTruthy();
      expect(r.priceInCents === 0 || r.priceInCents == null).toBe(true);
    }
  });

  it('offline sem cache informa necessidade de internet', async () => {
    const service = new ExternalInformationService(new MockExternalProvider());
    // força miss de cache limpando e usando query única
    const res = await service.search(
      {
        kind: 'event',
        city: 'CidadeX',
        state: 'GO',
        country: 'BR',
        query: 'unico-offline-test',
        isDemo: false,
      },
      { offline: true },
    );
    expect(res.offline).toBe(true);
    expect(res.unavailableReason).toMatch(/internet/i);
  });
});
