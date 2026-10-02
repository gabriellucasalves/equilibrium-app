import type { FinancialTool } from '@/features/assistant/tools/types';
import { monthKeyFromDate } from '@/utils/date';
import { formatCentsToBRL, sumCents } from '@/utils/money';
import { shiftMonthKey } from '@/utils/month';

/** Busca em notas de transação e itens de NFC-e/OCR. */
export const keywordSpendTool: FinancialTool = {
  name: 'get_keyword_spend',
  description: 'Gasto com palavra-chave (ex.: café) nos últimos meses',
  run: (snapshot, args) => {
    const keyword = fold(
      String(args?.keyword ?? args?.query ?? '').trim(),
    );
    if (!keyword) {
      return {
        toolName: 'get_keyword_spend',
        ok: false,
        data: {},
        summary: 'Me diga o que procurar (ex.: café, uber).',
      };
    }

    const months = [
      snapshot.monthKey,
      shiftMonthKey(snapshot.monthKey, -1),
      shiftMonthKey(snapshot.monthKey, -2),
    ];

    const byMonth: { monthKey: string; totalCents: number }[] = [];
    for (const monthKey of months) {
      const fromTx = snapshot.transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            monthKeyFromDate(t.date) === monthKey &&
            fold(t.note).includes(keyword),
        )
        .map((t) => t.amountCents);

      const fromItems = snapshot.receiptItems
        .filter((item) => {
          const date = item.purchaseDate;
          if (!date || monthKeyFromDate(date) !== monthKey) return false;
          const hay = fold(
            `${item.normalizedDescription} ${item.rawDescription}`,
          );
          return hay.includes(keyword);
        })
        .map((i) => i.totalPriceInCents);

      const totalCents = sumCents([...fromTx, ...fromItems]);
      byMonth.push({ monthKey, totalCents });
    }

    const total = sumCents(byMonth.map((m) => m.totalCents));

    return {
      toolName: 'get_keyword_spend',
      ok: true,
      data: {
        keyword,
        totalCents: total,
        totalFormatted: formatCentsToBRL(total),
        byMonth: byMonth.map((m) => ({
          ...m,
          totalFormatted: formatCentsToBRL(m.totalCents),
        })),
      },
      summary:
        total === 0
          ? `Não achei gastos com “${keyword}” nos últimos meses.`
          : `Com “${keyword}” você somou ${formatCentsToBRL(total)} nos últimos 3 meses.`,
    };
  },
};

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
