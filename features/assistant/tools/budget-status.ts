import type { FinancialTool } from '@/features/assistant/tools/types';
import { buildBudgetProgress } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';

export const budgetStatusTool: FinancialTool = {
  name: 'get_budget_status',
  description: 'Orçamentos e proximidade de limites',
  run: (snapshot) => {
    const progress = buildBudgetProgress(
      snapshot.budgets,
      snapshot.transactions,
      snapshot.monthKey,
    );
    const alerts = progress.filter((p) => p.usagePercent >= 80);
    return {
      toolName: 'get_budget_status',
      ok: true,
      data: {
        budgets: progress.map((p) => ({
          categoryKey: p.categoryKey,
          label: p.label,
          limitCents: p.limitCents,
          spentCents: p.spentCents,
          remainingCents: p.remainingCents,
          usagePercent: p.usagePercent,
          limitFormatted: formatCentsToBRL(p.limitCents),
          spentFormatted: formatCentsToBRL(p.spentCents),
          remainingFormatted: formatCentsToBRL(Math.max(0, p.remainingCents)),
        })),
        alertCount: alerts.length,
      },
      summary:
        alerts.length > 0
          ? `Atenção: ${alerts.map((a) => a.label).join(', ')} ${alerts.length === 1 ? 'está' : 'estão'} perto do limite.`
          : progress.length > 0
            ? 'Seus orçamentos estão confortáveis por enquanto.'
            : 'Você ainda não definiu orçamentos.',
    };
  },
};
