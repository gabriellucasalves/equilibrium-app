import { parseReceiptText } from '@/services/receipts/text-parser';

const SAMPLE = `
SUPERMERCADO ABC
CNPJ 12.345.678/0001-90
27/09/2026
ARROZ 5KG 1x 24,90
SABONETE 2x 8,50
DETERGENTE 12,00
TOTAL R$ 45,40
`;

describe('parseReceiptText', () => {
  it('extrai merchant, data, total e itens', () => {
    const parsed = parseReceiptText(SAMPLE, 'camera', 'test');
    expect(parsed.merchantName.toLowerCase()).toContain('supermercado');
    expect(parsed.purchaseDate).toBe('2026-09-27');
    expect(parsed.totalInCents).toBe(4540);
    expect(parsed.items.length).toBeGreaterThanOrEqual(2);
    expect(parsed.items[0]?.rawDescription).toBeTruthy();
    expect(parsed.items[0]?.normalizedDescription).toBeTruthy();
  });

  it('avisa quando não encontra itens', () => {
    const parsed = parseReceiptText('TEXTO SEM PRECOS', 'camera', 'test');
    expect(parsed.items).toHaveLength(0);
    expect(parsed.warning).toBeTruthy();
  });
});
