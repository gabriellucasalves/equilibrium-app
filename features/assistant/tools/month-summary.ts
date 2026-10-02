import type { FinancialTool } from '@/features/assistant/tools/types';
import { buildMonthSummary } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';
import { monthLabelBR } from '@/utils/month';

export const monthSummaryTool: FinancialTool = {
  name: 'get_month_summary',
  description: 'Resumo do mês: receitas, gastos e disponível',
  run: (snapshot) => {
    const summary = buildMonthSummary(
      snapshot.transactions,
      snapshot.monthKey,
      snapshot.monthlyIncomeCents,
    );
    return {
      toolName: 'get_month_summary',
      ok: true,
      data: {
        monthKey: snapshot.monthKey,
        incomeCents: summary.incomeCents,
        expenseCents: summary.expenseCents,
        availableCents: summary.availableCents,
        incomeFormatted: formatCentsToBRL(summary.incomeCents),
        expenseFormatted: formatCentsToBRL(summary.expenseCents),
        availableFormatted: formatCentsToBRL(summary.availableCents),
      },
      summary: `Em ${monthLabelBR(snapshot.monthKey)} você gastou ${formatCentsToBRL(summary.expenseCents)} e ainda pode usar ${formatCentsToBRL(summary.availableCents)}.`,
    };
  },
};
