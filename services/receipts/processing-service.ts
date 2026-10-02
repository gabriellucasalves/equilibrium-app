import { MockReceiptProvider } from '@/services/receipts/providers/mock-provider';
import { NFCeProvider } from '@/services/receipts/providers/nfce-provider';
import {
  OcrEdgeProvider,
  processWithFallback,
} from '@/services/receipts/providers/ocr-provider';
import type {
  ProcessedReceipt,
  ReceiptParserProvider,
  ReceiptProcessInput,
} from '@/services/receipts/types';

export class ReceiptProcessingService {
  constructor(private readonly providers: ReceiptParserProvider[]) {}

  static createDefault(): ReceiptProcessingService {
    return new ReceiptProcessingService([
      new MockReceiptProvider(),
      new NFCeProvider(),
      new OcrEdgeProvider(),
    ]);
  }

  async process(input: ReceiptProcessInput): Promise<ProcessedReceipt> {
    return processWithFallback(input, this.providers);
  }
}
