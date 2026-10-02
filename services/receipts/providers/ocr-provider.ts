import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import { MockReceiptProvider } from '@/services/receipts/providers/mock-provider';
import { parseReceiptText } from '@/services/receipts/text-parser';
import type {
  ProcessedReceipt,
  ReceiptParserProvider,
  ReceiptProcessInput,
} from '@/services/receipts/types';

/**
 * OCR via Edge Function (chave só no servidor).
 * Se a function/OCR não estiver configurada, falha com mensagem amigável
 * (exceto DEMO, que usa mock).
 */
export class OcrEdgeProvider implements ReceiptParserProvider {
  readonly name = 'ocr_edge';

  canHandle(input: ReceiptProcessInput): boolean {
    if (input.isDemo) return false;
    return Boolean(
      input.base64 ||
        input.uri ||
        input.rawText ||
        input.source === 'camera' ||
        input.source === 'gallery' ||
        input.source === 'pdf',
    );
  }

  async parse(input: ReceiptProcessInput): Promise<ProcessedReceipt> {
    if (input.rawText) {
      const processed = parseReceiptText(input.rawText, input.source, this.name);
      processed.filePath = input.filePath ?? null;
      processed.fileHash = input.fileHash ?? null;
      return processed;
    }

    if (input.source === 'pdf' && !input.base64) {
      return {
        merchantName: '',
        merchantDocument: null,
        purchaseDate: null,
        totalInCents: 0,
        discountInCents: 0,
        additionalChargesInCents: 0,
        items: [],
        confidence: 0,
        source: 'pdf',
        parserProvider: this.name,
        filePath: input.filePath ?? null,
        fileHash: input.fileHash ?? null,
        warning:
          'PDF armazenado. A leitura automática de PDF ainda é limitada — revise ou preencha os dados.',
      };
    }

    const client = getSupabase();
    if (!client) {
      throw new AppError(
        'OCR requer conexão com o servidor. Verifique sua conta e tente novamente.',
      );
    }

    const { data, error } = await client.functions.invoke('parse-receipt', {
      body: {
        mode: 'ocr',
        imageBase64: input.base64,
        mimeType: input.mimeType ?? 'image/jpeg',
        filePath: input.filePath,
      },
    });

    if (error) {
      throw new AppError(
        error,
        'Não consegui ler essa nota automaticamente.',
      );
    }

    if (data?.rawText) {
      const processed = parseReceiptText(
        String(data.rawText),
        input.source,
        this.name,
      );
      processed.filePath = input.filePath ?? null;
      processed.fileHash = input.fileHash ?? null;
      processed.confidence = Number(data.confidence ?? processed.confidence);
      return processed;
    }

    if (data?.unavailable) {
      throw new AppError(
        'OCR não configurado no servidor. Configure a chave no Edge Function ou use o modo DEMO.',
      );
    }

    throw new AppError('Não consegui ler essa nota automaticamente.');
  }
}

/** Atalho: em falha de OCR no DEMO já coberto pelo Mock. */
export async function processWithFallback(
  input: ReceiptProcessInput,
  providers: ReceiptParserProvider[],
): Promise<ProcessedReceipt> {
  for (const provider of providers) {
    if (!provider.canHandle(input)) continue;
    return provider.parse(input);
  }
  if (input.isDemo) {
    return new MockReceiptProvider().parse({ ...input, source: 'demo' });
  }
  throw new AppError('Nenhum processador disponível para este arquivo.');
}
