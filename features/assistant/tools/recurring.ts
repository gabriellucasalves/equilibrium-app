import type { FinancialTool } from '@/features/assistant/tools/types';
import { formatCentsToBRL } from '@/utils/money';
import { monthKeyFromDate } from '@/utils/date';

/** Detecta despesas que se repetem por descrição normalizada em ≥2 meses. */
export const recurringTool: FinancialTool = {
  name: 'detect_recurring',
  description: 'Despesas recorrentes aparentes',
  run: (snapshot) => {
    const expenses = snapshot.transactions.filter((t) => t.type === 'expense');
    const byKey = new Map<
      string,
      { note: string; months: Set<string>; amounts: number[] }
    >();

    for (const tx of expenses) {
      const key = tx.note.trim().toLowerCase() || tx.categoryKey;
      if (!key) continue;
      const entry = byKey.get(key) ?? {
        note: tx.note || tx.categoryKey,
        months: new Set<string>(),
        amounts: [],
      };
      entry.months.add(monthKeyFromDate(tx.date));
      entry.amounts.push(tx.amountCents);
      byKey.set(key, entry);
    }

    const recurring = [...byKey.values()]
      .filter((e) => e.months.size >= 2)
      .map((e) => {
        const avg = Math.round(
          e.amounts.reduce((a, b) => a + b, 0) / e.amounts.length,
        );
        return {
          description: e.note,
          monthsSeen: e.months.size,
          averageCents: avg,
          averageFormatted: formatCentsToBRL(avg),
        };
      })
      .sort((a, b) => b.averageCents - a.averageCents)
      .slice(0, 8);

    return {
      toolName: 'detect_recurring',
      ok: true,
      data: { recurring },
      summary:
        recurring.length === 0
          ? 'Ainda não aparece um padrão claro de despesas recorrentes.'
          : `Encontrei ${recurring.length} possível${recurring.length === 1 ? '' : 'is'} recorrência${recurring.length === 1 ? '' : 's'}, como “${recurring[0]?.description}”.`,
    };
  },
};
