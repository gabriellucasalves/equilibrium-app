import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import type {
  ConfirmReceiptInput,
  ReceiptRepository,
} from '@/repositories/interfaces/receipt-repository';
import { buildConfirmReceiptRpcParams } from '@/services/receipts/confirm-payload';
import { preferenceKey } from '@/services/receipts/normalization';
import type {
  ConfirmedReceipt,
  ReceiptItemDraft,
} from '@/services/receipts/types';

function requireClient() {
  const client = getSupabase();
  if (!client) throw new AppError('Supabase não configurado');
  return client;
}

export class SupabaseReceiptRepository implements ReceiptRepository {
  async list(): Promise<ConfirmedReceipt[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('receipts')
      .select('*')
      .order('purchase_date', { ascending: false });
    if (error) throw new AppError(error);
    const rows = data ?? [];
    const result: ConfirmedReceipt[] = [];
    for (const row of rows) {
      const items = await this.loadItems(row.id);
      result.push(mapReceipt(row, items));
    }
    return result;
  }

  async getById(id: string): Promise<ConfirmedReceipt | null> {
    const client = requireClient();
    const { data, error } = await client
      .from('receipts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new AppError(error);
    if (!data) return null;
    const items = await this.loadItems(id);
    return mapReceipt(data, items);
  }

  async getByTransactionId(
    transactionId: string,
  ): Promise<ConfirmedReceipt | null> {
    const client = requireClient();
    const { data: tx, error: txError } = await client
      .from('transactions')
      .select('receipt_id')
      .eq('id', transactionId)
      .maybeSingle();
    if (txError) throw new AppError(txError);
    if (!tx?.receipt_id) return null;
    return this.getById(tx.receipt_id);
  }

  async confirm(input: ConfirmReceiptInput): Promise<{ receiptId: string }> {
    const client = requireClient();
    const { data, error } = await client.rpc(
      'confirm_receipt',
      buildConfirmReceiptRpcParams(input),
    );
    if (error) throw new AppError(error);
    return { receiptId: String(data) };
  }

  async delete(id: string, options?: { deleteFile?: boolean }): Promise<void> {
    const client = requireClient();
    const current = await this.getById(id);
    const { error } = await client.from('receipts').delete().eq('id', id);
    if (error) throw new AppError(error);
    if (options?.deleteFile && current?.filePath) {
      await client.storage.from('receipt-files').remove([current.filePath]);
    }
  }

  async listPreferences(): Promise<Map<string, string>> {
    const client = requireClient();
    const { data, error } = await client
      .from('item_category_preferences')
      .select('normalized_key, category_key');
    if (error) throw new AppError(error);
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      map.set(preferenceKey(row.normalized_key), row.category_key);
    }
    return map;
  }

  private async loadItems(receiptId: string): Promise<ReceiptItemDraft[]> {
    const client = requireClient();
    const { data, error } = await client
      .from('receipt_items')
      .select('*')
      .eq('receipt_id', receiptId)
      .order('created_at', { ascending: true });
    if (error) throw new AppError(error);
    return (data ?? []).map((row) => ({
      id: row.id,
      rawDescription: row.raw_description,
      normalizedDescription: row.normalized_description,
      quantity: Number(row.quantity),
      unitPriceInCents:
        row.unit_price_cents === null ? null : Number(row.unit_price_cents),
      totalPriceInCents: Number(row.total_price_cents),
      categoryKey: row.category_key,
      confidence: row.confidence === null ? null : Number(row.confidence),
      uncertain: row.confidence !== null && Number(row.confidence) < 0.5,
    }));
  }
}

function mapReceipt(
  row: Record<string, unknown>,
  items: ReceiptItemDraft[],
): ConfirmedReceipt {
  return {
    id: String(row.id),
    merchantName: String(row.merchant_name ?? ''),
    merchantDocument: (row.merchant_document as string | null) ?? null,
    purchaseDate: (row.purchase_date as string | null) ?? null,
    totalAmountCents: Number(row.total_amount_cents ?? 0),
    discountCents: Number(row.discount_cents ?? 0),
    additionalChargesCents: Number(row.additional_charges_cents ?? 0),
    sourceType: row.source_type as ConfirmedReceipt['sourceType'],
    filePath: (row.file_path as string | null) ?? null,
    fileHash: (row.file_hash as string | null) ?? null,
    processingStatus: row.processing_status as ConfirmedReceipt['processingStatus'],
    parserProvider: (row.parser_provider as string | null) ?? null,
    parserConfidence:
      row.parser_confidence === null || row.parser_confidence === undefined
        ? null
        : Number(row.parser_confidence),
    items,
  };
}
