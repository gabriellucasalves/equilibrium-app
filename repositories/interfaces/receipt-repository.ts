import type {
  ConfirmedReceipt,
  ProcessedReceipt,
  ReceiptItemDraft,
} from '@/services/receipts/types';

export type ConfirmReceiptInput = {
  receipt: ProcessedReceipt;
  items: ReceiptItemDraft[];
  categoryKey: string;
  preferences?: { normalizedKey: string; categoryKey: string }[];
};

export interface ReceiptRepository {
  list(): Promise<ConfirmedReceipt[]>;
  getById(id: string): Promise<ConfirmedReceipt | null>;
  getByTransactionId(transactionId: string): Promise<ConfirmedReceipt | null>;
  confirm(input: ConfirmReceiptInput): Promise<{ receiptId: string }>;
  delete(id: string, options?: { deleteFile?: boolean }): Promise<void>;
  listPreferences(): Promise<Map<string, string>>;
}
