import { MockReceiptProvider } from '@/services/receipts/providers/mock-provider';
import { sumItemsCents } from '@/services/receipts/normalization';

describe('MockReceiptProvider', () => {
  it('gera nota demo de R$ 187,42 com itens categorizados', async () => {
    const provider = new MockReceiptProvider();
    const receipt = await provider.parse({ source: 'demo', isDemo: true });
    expect(receipt.merchantName).toBe('Supermercado ABC');
    expect(receipt.totalInCents).toBe(18742);
    expect(sumItemsCents(receipt.items)).toBe(18742);
    expect(receipt.items.length).toBe(12);
    expect(receipt.items.some((i) => i.categoryKey === 'hygiene')).toBe(true);
    expect(receipt.items.some((i) => i.categoryKey === 'pets')).toBe(true);
  });
});
