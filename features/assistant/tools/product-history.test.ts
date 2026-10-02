import { compareExternalPriceToHistory } from '@/features/assistant/tools/product-history';
import { FinancialToolRegistry } from '@/features/assistant/tools/registry';
import type { FinancialSnapshot } from '@/features/assistant/types';
import { currentMonthKey } from '@/utils/date';

describe('product history + price compare', () => {
  it('classifica preço abaixo da média sem exagero', () => {
    const cmp = compareExternalPriceToHistory({
      externalPriceInCents: 1799,
      averagePriceInCents: 1950,
      lowestPriceInCents: 1700,
    });
    expect(cmp.classification).toBe('below_history');
    expect(cmp.summary).toMatch(/abaixo da sua média/);
    expect(cmp.summary).not.toMatch(/IMPERD/);
  });

  it('agrega histórico de receipt_items', () => {
    const month = currentMonthKey();
    const snap: FinancialSnapshot = {
      displayName: 'G',
      monthlyIncomeCents: 100,
      budgets: [],
      transactions: [],
      monthKey: month,
      receiptItems: [
        {
          normalizedDescription: 'Cafe espresso',
          rawDescription: 'CAFE',
          totalPriceInCents: 1890,
          categoryKey: 'beverages',
          purchaseDate: `${month}-01`,
        },
        {
          normalizedDescription: 'Cafe espresso',
          rawDescription: 'CAFE',
          totalPriceInCents: 2190,
          categoryKey: 'beverages',
          purchaseDate: `${month}-10`,
        },
      ],
    };
    const result = new FinancialToolRegistry().run(
      'get_product_purchase_history',
      snap,
      { keyword: 'cafe' },
    );
    expect(result.data.purchaseCount).toBe(2);
    expect(result.data.averagePrice).toBe(2040);
  });
});
