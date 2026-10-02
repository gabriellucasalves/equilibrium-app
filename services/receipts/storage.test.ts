import {
  buildReceiptObjectPath,
  estimateBase64Bytes,
  MAX_RECEIPT_BYTES,
} from '@/services/receipts/storage';

describe('storage helpers', () => {
  it('monta path user/year/month/id.ext', () => {
    const path = buildReceiptObjectPath(
      'user-1',
      'rec-1',
      'jpg',
      new Date('2026-09-15T12:00:00Z'),
    );
    expect(path).toBe('user-1/2026/09/rec-1.jpg');
  });

  it('estima tamanho de base64', () => {
    // "AAAA" -> 3 bytes
    expect(estimateBase64Bytes('AAAA')).toBe(3);
    expect(MAX_RECEIPT_BYTES).toBe(10 * 1024 * 1024);
  });
});
