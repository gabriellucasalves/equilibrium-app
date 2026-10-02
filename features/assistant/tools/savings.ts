import type { FinancialTool } from '@/features/assistant/tools/types';
import { buildBudgetProgress, categoryLabel, filterTransactionsByMonth } from '@/utils/finance-summary';
import { formatCentsToBRL } from '@/utils/money';

/** Sugestões determinísticas — sem LLM inventando economia. */
export const savingsTool: FinancialTool = {
  name: 'suggest_savings',
  description: 'Onde economizar com base em orçamentos e categorias',
  run: (snapshot) => {
    const progress = buildBudgetProgress(
      snapshot.budgets,
      snapshot.transactions,
      snapshot.monthKey,
    );
    const suggestions: string[] = [];

    for (const b of progress) {
      if (b.usagePercent >= 90) {
        suggestions.push(
          `${b.label} já usou ${b.usagePercent}% do limite — vale pausar novos gastos aí.`,
        );
      } else if (b.usagePercent >= 70 && b.remainingCents > 0) {
        suggestions.push(
          `Em ${b.label} restam ${formatCentsToBRL(b.remainingCents)} do orçamento.`,
        );
      }
    }

    const monthExpenses = filterTransactionsByMonth(
      snapshot.transactions,
      snapshot.monthKey,
    ).filter((t) => t.type === 'expense');

    const byCat = new Map<string, number>();
    for (const tx of monthExpenses) {
      byCat.set(tx.categoryKey, (byCat.get(tx.categoryKey) ?? 0) + tx.amountCents);
    }
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] > 0) {
      const tenPercent = Math.round(top[1] * 0.1);
      suggestions.push(
        `Reduzir 10% em ${categoryLabel(top[0])} liberaria cerca de ${formatCentsToBRL(tenPercent)} este mês.`,
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'Com os dados atuais, o melhor caminho é manter o registro das despesas para enxergar padrões.',
      );
    }

    return {
      toolName: 'suggest_savings',
      ok: true,
      data: { suggestions: suggestions.slice(0, 4) },
      summary: suggestions[0] ?? '',
    };
  },
};
