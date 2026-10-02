import { findDuplicateReceipt } from '@/services/receipts/duplicate';
import type { ConfirmedReceipt } from '@/services/receipts/types';

function receipt(
  patch: Partial<ConfirmedReceipt> & Pick<ConfirmedReceipt, 'id'>,
): ConfirmedReceipt {
  return {
    merchantName: 'Supermercado ABC',
    merchantDocument: null,
    purchaseDate: '2026-09-27',
    totalAmountCents: 18742,
    discountCents: 0,
    additionalChargesCents: 0,
    sourceType: 'camera',
    filePath: null,
    fileHash: null,
    processingStatus: 'confirmed',
    parserProvider: 'mock',
    parserConfidence: 0.9,
    items: [],
    ...patch,
  };
}

describe('findDuplicateReceipt', () => {
  it('detecta por hash de arquivo', () => {
    const existing = [receipt({ id: 'a', fileHash: 'abc123' })];
    const dup = findDuplicateReceipt(
      {
        merchantName: 'Outro',
        purchaseDate: '2026-01-01',
        totalInCents: 1,
        fileHash: 'abc123',
      },
      existing,
    );
    expect(dup?.reason).toBe('hash');
    expect(dup?.receipt.id).toBe('a');
  });

  it('detecta por fingerprint merchant+date+total', () => {
    const existing = [receipt({ id: 'b', fileHash: null })];
    const dup = findDuplicateReceipt(
      {
        merchantName: 'Supermercado ABC',
        purchaseDate: '2026-09-27',
        totalInCents: 18742,
        fileHash: null,
      },
      existing,
    );
    expect(dup?.reason).toBe('fingerprint');
  });

  it('não marca nota diferente', () => {
    const existing = [receipt({ id: 'c' })];
    const dup = findDuplicateReceipt(
      {
        merchantName: 'Padaria',
        purchaseDate: '2026-09-27',
        totalInCents: 18742,
        fileHash: null,
      },
      existing,
    );
    expect(dup).toBeNull();
  });
});
