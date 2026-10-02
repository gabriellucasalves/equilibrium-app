import {
  buildExportPayload,
  exportToJson,
  transactionsToCsv,
} from '@/utils/export-data';

describe('export-data', () => {
  it('monta JSON estruturado', () => {
    const payload = buildExportPayload({
      transactions: [
        {
          id: 't1',
          type: 'expense',
          amountCents: 100,
          categoryKey: 'groceries',
          note: 'Pão',
          date: '2026-10-01',
          createdAt: '',
          updatedAt: '',
        },
      ],
      budgets: [{ categoryKey: 'groceries', limitCents: 80_000 }],
      goals: [],
      recurring: [],
    });
    const json = exportToJson(payload);
    expect(json).toContain('"formatVersion": 1');
    expect(json).toContain('Pão');
  });

  it('gera CSV de transações', () => {
    const csv = transactionsToCsv([
      {
        id: 't1',
        type: 'expense',
        amountCents: 100,
        categoryKey: 'groceries',
        note: 'Pão, "integral"',
        date: '2026-10-01',
        createdAt: '',
        updatedAt: '',
      },
    ]);
    expect(csv.split('\n')[0]).toContain('amount_cents');
    expect(csv).toContain('"Pão, ""integral"""');
  });
});
