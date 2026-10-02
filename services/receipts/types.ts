export type ReceiptSourceType =
  | 'camera'
  | 'gallery'
  | 'pdf'
  | 'qr'
  | 'manual'
  | 'demo';

export type ReceiptProcessingStatus =
  | 'uploading'
  | 'processing'
  | 'review'
  | 'confirmed'
  | 'failed';

export type ReceiptItemDraft = {
  id: string;
  rawDescription: string;
  normalizedDescription: string;
  quantity: number;
  unitPriceInCents: number | null;
  totalPriceInCents: number;
  categoryKey: string;
  confidence: number | null;
  uncertain?: boolean;
};

export type ProcessedReceipt = {
  merchantName: string;
  merchantDocument: string | null;
  purchaseDate: string | null;
  totalInCents: number;
  discountInCents: number;
  additionalChargesInCents: number;
  items: ReceiptItemDraft[];
  confidence: number;
  source: ReceiptSourceType;
  parserProvider: string;
  filePath?: string | null;
  fileHash?: string | null;
  openExternalUrl?: string | null;
  warning?: string | null;
};

export type ReceiptProcessInput = {
  source: ReceiptSourceType;
  uri?: string;
  mimeType?: string;
  base64?: string;
  qrPayload?: string;
  rawText?: string;
  isDemo?: boolean;
  filePath?: string | null;
  fileHash?: string | null;
};

export interface ReceiptParserProvider {
  readonly name: string;
  canHandle(input: ReceiptProcessInput): boolean;
  parse(input: ReceiptProcessInput): Promise<ProcessedReceipt>;
}

export type ConfirmedReceipt = {
  id: string;
  merchantName: string;
  merchantDocument: string | null;
  purchaseDate: string | null;
  totalAmountCents: number;
  discountCents: number;
  additionalChargesCents: number;
  sourceType: ReceiptSourceType;
  filePath: string | null;
  fileHash: string | null;
  processingStatus: ReceiptProcessingStatus;
  parserProvider: string | null;
  parserConfidence: number | null;
  items: ReceiptItemDraft[];
  transactionId?: string | null;
};
