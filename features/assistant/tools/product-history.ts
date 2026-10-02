import type { FinancialTool } from '@/features/assistant/tools/types';
import { preferenceKey } from '@/services/receipts/normalization';
import { formatCentsToBRL } from '@/utils/money';

export const productPurchaseHistoryTool: FinancialTool = {
  name: 'get_product_purchase_history',
  description: 'Histórico de preços de um item nas notas do usuário',
  run: (snapshot, args) => {
    const query = String(args?.keyword ?? args?.query ?? '')
      .trim()
      .toLowerCase();
    if (!query) {
      return {
        toolName: 'get_product_purchase_history',
        ok: false,
        data: {},
        summary: 'Me diga qual produto consultar (ex.: café).',
      };
    }

    const key = preferenceKey(query);
    const matches = snapshot.receiptItems.filter((item) => {
      const hay = preferenceKey(
        `${item.normalizedDescription} ${item.rawDescription}`,
      );
      return hay.includes(key) || key.includes(hay);
    });

    if (matches.length === 0) {
      return {
        toolName: 'get_product_purchase_history',
        ok: true,
        data: {
          query,
          purchaseCount: 0,
        },
        summary: `Não encontrei “${query}” no histórico das suas notas.`,
      };
    }

    const prices = matches.map((m) => m.totalPriceInCents).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const averagePrice = Math.round(sum / prices.length);
    const last = matches[matches.length - 1]!;
    const lowestPrice = prices[0]!;
    const highestPrice = prices[prices.length - 1]!;

    return {
      toolName: 'get_product_purchase_history',
      ok: true,
      data: {
        query,
        purchaseCount: matches.length,
        averagePrice,
        lastPrice: last.totalPriceInCents,
        lowestPrice,
        highestPrice,
        averageFormatted: formatCentsToBRL(averagePrice),
        lastFormatted: formatCentsToBRL(last.totalPriceInCents),
        lowestFormatted: formatCentsToBRL(lowestPrice),
        highestFormatted: formatCentsToBRL(highestPrice),
        period: 'histórico nas notas',
      },
      summary: `Nas suas notas, “${query}” aparece ${matches.length}x — média ${formatCentsToBRL(averagePrice)}, última ${formatCentsToBRL(last.totalPriceInCents)}.`,
    };
  },
};

export type PriceClassification =
  | 'below_history'
  | 'near_average'
  | 'above_history';

export function compareExternalPriceToHistory(input: {
  externalPriceInCents: number;
  averagePriceInCents: number;
  lowestPriceInCents: number;
}): {
  differenceCents: number;
  percentageDifference: number;
  classification: PriceClassification;
  summary: string;
} {
  const { externalPriceInCents, averagePriceInCents } = input;
  const differenceCents = averagePriceInCents - externalPriceInCents;
  const percentageDifference =
    averagePriceInCents === 0
      ? 0
      : Math.round((differenceCents / averagePriceInCents) * 1000) / 10;

  let classification: PriceClassification = 'near_average';
  if (percentageDifference >= 5) classification = 'below_history';
  else if (percentageDifference <= -5) classification = 'above_history';

  const absDiff = Math.abs(differenceCents);
  const absPct = Math.abs(percentageDifference);
  let summary: string;
  if (classification === 'below_history') {
    summary = `Está cerca de ${absPct}% abaixo da sua média recente (${formatCentsToBRL(absDiff)} a menos).`;
  } else if (classification === 'above_history') {
    summary = `Está cerca de ${absPct}% acima da sua média recente.`;
  } else {
    summary = 'Está próximo da média que você pagou recentemente.';
  }

  return {
    differenceCents,
    percentageDifference,
    classification,
    summary,
  };
}

export const comparePriceTool: FinancialTool = {
  name: 'compare_external_price_to_history',
  description: 'Compara preço externo com histórico do usuário',
  run: (_snapshot, args) => {
    const external = Number(args?.externalPriceInCents ?? 0);
    const average = Number(args?.averagePriceInCents ?? 0);
    const lowest = Number(args?.lowestPriceInCents ?? average);
    if (!Number.isFinite(external) || !Number.isFinite(average) || average <= 0) {
      return {
        toolName: 'compare_external_price_to_history',
        ok: false,
        data: {},
        summary: 'Sem histórico suficiente para comparar.',
      };
    }
    const cmp = compareExternalPriceToHistory({
      externalPriceInCents: external,
      averagePriceInCents: average,
      lowestPriceInCents: lowest,
    });
    return {
      toolName: 'compare_external_price_to_history',
      ok: true,
      data: { ...cmp, externalPriceInCents: external, averagePriceInCents: average },
      summary: cmp.summary,
    };
  },
};
