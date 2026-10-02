import type { FinancialTool } from '@/features/assistant/tools/types';
import { toISODate } from '@/utils/date';
import { getMonthProjection } from '@/utils/month-projection';
import { formatCentsToBRL } from '@/utils/money';

export const getMonthProjectionTool: FinancialTool = {
  name: 'get_month_projection',
  description: 'Projeção do disponível após contas previstas',
  run: (snapshot) => {
    const projection = getMonthProjection({
      transactions: snapshot.transactions,
      recurring: snapshot.recurring ?? [],
      monthKey: snapshot.monthKey,
      monthlyIncomeCents: snapshot.monthlyIncomeCents,
      todayISO: toISODate(),
    });

    return {
      toolName: 'get_month_projection',
      ok: true,
      data: {
        ...projection,
        currentAvailableFormatted: formatCentsToBRL(
          projection.currentAvailableCents,
        ),
        upcomingRecurringFormatted: formatCentsToBRL(
          projection.upcomingRecurringCents,
        ),
        projectedAvailableFormatted: formatCentsToBRL(
          projection.projectedAvailableCents,
        ),
      },
      summary: `Disponível agora ${formatCentsToBRL(projection.currentAvailableCents)}; contas previstas ${formatCentsToBRL(projection.upcomingRecurringCents)}; disponível projetado ${formatCentsToBRL(projection.projectedAvailableCents)}. É uma estimativa, não o saldo bancário.`,
    };
  },
};
