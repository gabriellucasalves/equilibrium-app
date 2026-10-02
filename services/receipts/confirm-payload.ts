import type { ConfirmReceiptInput } from '@/repositories/interfaces/receipt-repository';

/** Serializa o payload da RPC `confirm_receipt` (puro / testável). */
export function buildConfirmReceiptRpcParams(input: ConfirmReceiptInput) {
  const r = input.receipt;
  return {
    p_receipt: {
      merchant_name: r.merchantName,
      merchant_document: r.merchantDocument,
      purchase_date: r.purchaseDate,
      total_amount_cents: r.totalInCents,
      discount_cents: r.discountInCents,
      additional_charges_cents: r.additionalChargesInCents,
      source_type: r.source,
      file_path: r.filePath,
      file_hash: r.fileHash,
      parser_provider: r.parserProvider,
      parser_confidence: r.confidence,
    },
    p_items: input.items.map((item) => ({
      id: isUuid(item.id) ? item.id : undefined,
      raw_description: item.rawDescription,
      normalized_description: item.normalizedDescription,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceInCents,
      total_price_cents: item.totalPriceInCents,
      category_key: item.categoryKey,
      confidence: item.confidence,
    })),
    p_transaction: {
      amount_cents: r.totalInCents,
      description: r.merchantName || 'Nota fiscal',
      category_key: input.categoryKey,
      transaction_date: r.purchaseDate,
    },
    p_preferences: (input.preferences ?? []).map((p) => ({
      normalized_key: p.normalizedKey,
      category_key: p.categoryKey,
    })),
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
