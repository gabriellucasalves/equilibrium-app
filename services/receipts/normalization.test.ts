import {
  normalizeItemDescription,
  preferenceKey,
  sumItemsCents,
  totalDifferenceCents,
} from '@/services/receipts/normalization';

describe('normalizeItemDescription', () => {
  it('preserva legibilidade e remove ruído de cupom', () => {
    expect(normalizeItemDescription('ARROZ T1 5KG CDB')).toBe('Arroz 5kg');
    expect(normalizeItemDescription('COCA COLA LT 350')).toMatch(/Coca Cola/i);
  });

  it('não apaga texto vazio de forma estranha', () => {
    expect(normalizeItemDescription('   ')).toBe('');
  });
});

describe('preferenceKey', () => {
  it('normaliza acentos e pontuação', () => {
    expect(preferenceKey('Café com Leite!')).toBe('cafe com leite');
  });
});

describe('sumItemsCents / totalDifferenceCents', () => {
  it('soma itens em centavos', () => {
    expect(
      sumItemsCents([
        { totalPriceInCents: 2490 },
        { totalPriceInCents: 850 },
      ]),
    ).toBe(3340);
  });

  it('calcula diferença sem bloquear', () => {
    expect(totalDifferenceCents(18492, 18742)).toBe(250);
    expect(totalDifferenceCents(18742, 18742)).toBe(0);
  });

  it('rejeita valores não inteiros', () => {
    expect(() => sumItemsCents([{ totalPriceInCents: 10.5 }])).toThrow();
  });
});
