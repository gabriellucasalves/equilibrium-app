import { createId } from '@/utils/id';
import { ReceiptCategoryEngine } from '@/services/receipts/category-engine';
import { normalizeItemDescription } from '@/services/receipts/normalization';
import type { ProcessedReceipt, ReceiptItemDraft, ReceiptSourceType } from '@/services/receipts/types';

/** Extrai merchant/total/itens de texto OCR bruto (heurístico BR). */
export function parseReceiptText(
  rawText: string,
  source: ReceiptSourceType,
  providerName: string,
  preferences?: ReadonlyMap<string, string>,
): ProcessedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const engine = new ReceiptCategoryEngine(preferences);
  let merchantName = lines[0] ?? 'Estabelecimento';
  let merchantDocument: string | null = null;
  let purchaseDate: string | null = null;
  let totalInCents = 0;

  const cnpj = rawText.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
  if (cnpj) merchantDocument = cnpj[0];

  const dateMatch = rawText.match(
    /(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})/,
  );
  if (dateMatch) {
    const [, d, m, yRaw] = dateMatch;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    purchaseDate = `${y}-${m}-${d}`;
  }

  const totalMatch = rawText.match(
    /(?:TOTAL|VALOR\s*TOTAL|VL\s*TOTAL)[^\d]{0,12}(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/i,
  );
  if (totalMatch) {
    totalInCents = brlToCents(totalMatch[1]);
  }

  const items: ReceiptItemDraft[] = [];
  for (const line of lines) {
    if (/total|cnpj|cpf|chave|nfc-e|protocolo/i.test(line)) continue;
    const itemMatch = line.match(
      /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*[xX]?\s*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})$/,
    );
    const simplePrice = line.match(
      /^(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})$/,
    );
    const matched = itemMatch || simplePrice;
    if (!matched) continue;

    const rawDescription = matched[1].trim();
    if (rawDescription.length < 3) continue;
    const qty = itemMatch ? Number(itemMatch[2].replace(',', '.')) : 1;
    const totalPriceInCents = brlToCents(matched[matched.length - 1]);
    if (totalPriceInCents <= 0) continue;

    const normalizedDescription = normalizeItemDescription(rawDescription);
    const suggestion = engine.suggest(normalizedDescription, merchantName);
    items.push({
      id: createId('ri'),
      rawDescription,
      normalizedDescription,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      unitPriceInCents: Math.round(
        totalPriceInCents / Math.max(qty || 1, 0.001),
      ),
      totalPriceInCents,
      categoryKey: suggestion.categoryKey,
      confidence: suggestion.confidence,
      uncertain: suggestion.confidence < 0.5,
    });
  }

  if (totalInCents <= 0 && items.length > 0) {
    totalInCents = items.reduce((a, i) => a + i.totalPriceInCents, 0);
  }

  if (/supermercado|market|mercearia/i.test(rawText)) {
    const m = rawText.match(/((?:SUPERMERCADO|MERCADO)[^\n]{0,40})/i);
    if (m) merchantName = m[1].trim();
  }

  return {
    merchantName,
    merchantDocument,
    purchaseDate,
    totalInCents,
    discountInCents: 0,
    additionalChargesInCents: 0,
    items,
    confidence: items.length > 0 ? 0.7 : 0.3,
    source,
    parserProvider: providerName,
    warning:
      items.length === 0
        ? 'Não encontrei itens com confiança. Revise ou preencha manualmente.'
        : null,
  };
}

function brlToCents(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}
