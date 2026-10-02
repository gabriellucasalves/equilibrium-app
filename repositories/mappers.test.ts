import { isUuid, toDomainTransaction } from '@/repositories/mappers';

describe('supabase mappers', () => {
  test('isUuid', () => {
    expect(isUuid('tx_local_1')).toBe(false);
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  test('toDomainTransaction preserva centavos e DATE civil', () => {
    const tx = toDomainTransaction({
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'expense',
      amount_cents: 18742,
      description: 'Mercado',
      category_key: 'groceries',
      transaction_date: '2026-09-30',
      created_at: '2026-09-30T12:00:00Z',
      updated_at: '2026-09-30T12:00:00Z',
      deleted_at: null,
    });
    expect(tx.amountCents).toBe(18742);
    expect(tx.date).toBe('2026-09-30');
    expect(tx.note).toBe('Mercado');
  });
});
