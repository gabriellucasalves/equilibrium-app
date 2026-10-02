import { buildConfirmReceiptRpcParams } from '@/services/receipts/confirm-payload';
import type { ProcessedReceipt } from '@/services/receipts/types';

const draft: ProcessedReceipt = {
  merchantName: 'Supermercado ABC',
  merchantDocument: '12.345.678/0001-90',
  purchaseDate: '2026-09-27',
  totalInCents: 18742,
  discountInCents: 0,
  additionalChargesInCents: 250,
  items: [],
  confidence: 0.9,
  source: 'camera',
  parserProvider: 'ocr_edge',
  filePath: 'uid/2026/09/r1.jpg',
  fileHash: 'hash1',
};

describe('buildConfirmReceiptRpcParams', () => {
  it('serializa receipt, items, transaction e preferências', () => {
    const params = buildConfirmReceiptRpcParams({
      receipt: draft,
      items: [
        {
          id: 'ri_local',
          rawDescription: 'ARROZ T1 5KG',
          normalizedDescription: 'Arroz 5kg',
          quantity: 1,
          unitPriceInCents: 2490,
          totalPriceInCents: 2490,
          categoryKey: 'groceries',
          confidence: 0.86,
        },
      ],
      categoryKey: 'groceries',
      preferences: [
        { normalizedKey: 'arroz 5kg', categoryKey: 'groceries' },
      ],
    });

    expect(params.p_receipt.total_amount_cents).toBe(18742);
    expect(params.p_receipt.additional_charges_cents).toBe(250);
    expect(params.p_items[0]?.id).toBeUndefined();
    expect(params.p_items[0]?.raw_description).toBe('ARROZ T1 5KG');
    expect(params.p_transaction.amount_cents).toBe(18742);
    expect(params.p_transaction.category_key).toBe('groceries');
    expect(params.p_preferences[0]?.normalized_key).toBe('arroz 5kg');
  });

  it('mantém UUID válido do item', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const params = buildConfirmReceiptRpcParams({
      receipt: draft,
      items: [
        {
          id,
          rawDescription: 'X',
          normalizedDescription: 'X',
          quantity: 1,
          unitPriceInCents: 100,
          totalPriceInCents: 100,
          categoryKey: 'others',
          confidence: null,
        },
      ],
      categoryKey: 'others',
    });
    expect(params.p_items[0]?.id).toBe(id);
  });
});
