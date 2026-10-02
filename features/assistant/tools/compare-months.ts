import type { FinancialTool } from '@/features/assistant/tools/types';
import type { Transaction } from '@/types/finance';
import { buildMonthSummary, categoryLabel, filterTransactionsByMonth } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';
import { monthLabelBR, shiftMonthKey } from '@/utils/month';

export const compareMonthsTool: FinancialTool = {
  name: 'compare_months',
  description: 'Compara gastos com o mês anterior e categoria que mais subiu',
  run: (snapshot) => {
    const prevKey = shiftMonthKey(snapshot.monthKey, -1);
    const current = buildMonthSummary(
      snapshot.transactions,
      snapshot.monthKey,
      snapshot.monthlyIncomeCents,
    );
    const previous = buildMonthSummary(
      snapshot.transactions,
      prevKey,
      snapshot.monthlyIncomeCents,
    );
    const delta = current.expenseCents - previous.expenseCents;

    const currCats = categoryMap(snapshot.transactions, snapshot.monthKey);
    const prevCats = categoryMap(snapshot.transactions, prevKey);
    let maxKey = '';
    let maxDelta = 0;
    for (const [key, spent] of currCats) {
      const d = spent - (prevCats.get(key) ?? 0);
      if (d > maxDelta) {
        maxDelta = d;
        maxKey = key;
      }
    }

    return {
      toolName: 'compare_months',
      ok: true,
      data: {
        currentMonth: snapshot.monthKey,
        previousMonth: prevKey,
        currentExpenseCents: current.expenseCents,
        previousExpenseCents: previous.expenseCents,
        deltaCents: delta,
        currentFormatted: formatCentsToBRL(current.expenseCents),
        previousFormatted: formatCentsToBRL(previous.expenseCents),
        deltaFormatted: formatCentsToBRL(Math.abs(delta)),
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
        categoryMostIncreased:
          maxKey && maxDelta > 0
            ? {
                categoryKey: maxKey,
                label: categoryLabel(maxKey),
                deltaCents: maxDelta,
                deltaFormatted: formatCentsToBRL(maxDelta),
              }
            : null,
      },
      summary:
        previous.expenseCents === 0 && current.expenseCents === 0
          ? 'Ainda não há histórico suficiente para comparar meses.'
          : delta === 0
            ? `Seus gastos de ${monthLabelBR(snapshot.monthKey)} estão iguais aos de ${monthLabelBR(prevKey)}.`
            : delta > 0
              ? `Você gastou ${formatCentsToBRL(delta)} a mais que em ${monthLabelBR(prevKey)}.`
              : `Você gastou ${formatCentsToBRL(Math.abs(delta))} a menos que em ${monthLabelBR(prevKey)}.`,
    };
  },
};

function categoryMap(
  transactions: readonly Transaction[],
  monthKey: string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of filterTransactionsByMonth(transactions, monthKey)) {
    if (tx.type !== 'expense') continue;
    map.set(tx.categoryKey, (map.get(tx.categoryKey) ?? 0) + tx.amountCents);
  }
  return map;
}
