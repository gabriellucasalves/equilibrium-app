import type { FinancialTool } from '@/features/assistant/tools/types';
import { filterTransactionsByMonth } from '@/utils/finance-summary';
import { formatCentsToBRL, sumCents } from '@/utils/money';

export const merchantSpendTool: FinancialTool = {
  name: 'get_merchant_spend',
  description: 'Gasto em um estabelecimento (descrição da transação)',
  run: (snapshot, args) => {
    const query = String(args?.merchant ?? args?.query ?? '')
      .trim()
      .toLowerCase();
    if (!query) {
      return {
        toolName: 'get_merchant_spend',
        ok: false,
        data: {},
        summary: 'Preciso do nome do estabelecimento para consultar.',
      };
    }

    const matches = filterTransactionsByMonth(
      snapshot.transactions,
      snapshot.monthKey,
    ).filter(
      (t) =>
        t.type === 'expense' && t.note.toLowerCase().includes(query),
    );
    const total = sumCents(matches.map((m) => m.amountCents));

    return {
      toolName: 'get_merchant_spend',
      ok: true,
      data: {
        query,
        matchCount: matches.length,
        totalCents: total,
        totalFormatted: formatCentsToBRL(total),
      },
      summary:
        matches.length === 0
          ? `Não encontrei gastos com “${query}” neste mês.`
          : `Em “${query}” você gastou ${formatCentsToBRL(total)} (${matches.length} lançamento${matches.length === 1 ? '' : 's'}).`,
    };
  },
};
