import type { FinancialTool } from '@/features/assistant/tools/types';
import { categoryLabel, filterTransactionsByMonth } from '@/utils/finance-summary';
import { formatCentsToBRL, sumCents } from '@/utils/money';

function spendByCategory(
  snapshot: Parameters<FinancialTool['run']>[0],
): { categoryKey: string; label: string; spentCents: number }[] {
  const monthTx = filterTransactionsByMonth(
    snapshot.transactions,
    snapshot.monthKey,
  ).filter((t) => t.type === 'expense');

  const map = new Map<string, number>();
  for (const tx of monthTx) {
    map.set(tx.categoryKey, (map.get(tx.categoryKey) ?? 0) + tx.amountCents);
  }

  return [...map.entries()]
    .map(([categoryKey, spentCents]) => ({
      categoryKey,
      label: categoryLabel(categoryKey),
      spentCents,
    }))
    .sort((a, b) => b.spentCents - a.spentCents);
}

export const topCategoriesTool: FinancialTool = {
  name: 'get_top_categories',
  description: 'Categorias com maior gasto no mês',
  run: (snapshot) => {
    const rows = spendByCategory(snapshot);
    const total = sumCents(rows.map((r) => r.spentCents));
    return {
      toolName: 'get_top_categories',
      ok: true,
      data: {
        totalCents: total,
        categories: rows.slice(0, 8).map((r) => ({
          ...r,
          spentFormatted: formatCentsToBRL(r.spentCents),
        })),
      },
      summary:
        rows[0] != null
          ? `Você está gastando mais com ${rows[0].label} (${formatCentsToBRL(rows[0].spentCents)}).`
          : 'Ainda não há despesas neste mês.',
    };
  },
};

export const categorySpendTool: FinancialTool = {
  name: 'get_category_spend',
  description: 'Gasto em uma categoria específica',
  run: (snapshot, args) => {
    const key = String(args?.categoryKey ?? '').trim();
    const rows = spendByCategory(snapshot);
    const match =
      rows.find((r) => r.categoryKey === key) ??
      rows.find((r) =>
        r.label.toLowerCase().includes(String(args?.label ?? '').toLowerCase()),
      );

    if (!match) {
      return {
        toolName: 'get_category_spend',
        ok: true,
        data: { categoryKey: key, spentCents: 0 },
        summary: 'Não encontrei gastos nessa categoria neste mês.',
      };
    }

    return {
      toolName: 'get_category_spend',
      ok: true,
      data: {
        categoryKey: match.categoryKey,
        label: match.label,
        spentCents: match.spentCents,
        spentFormatted: formatCentsToBRL(match.spentCents),
      },
      summary: `Com ${match.label} você gastou ${formatCentsToBRL(match.spentCents)} este mês.`,
    };
  },
};
