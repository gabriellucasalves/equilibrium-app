import { AppError } from '@/services/errors/map-error';
import { getSupabase } from '@/lib/supabase/client';
import { parseReceiptText } from '@/services/receipts/text-parser';
import type {
  ProcessedReceipt,
  ReceiptParserProvider,
  ReceiptProcessInput,
} from '@/services/receipts/types';

/**
 * NFC-e via QR/URL.
 * Não tenta burlar CAPTCHA — se SEFAZ bloquear, retorna fallback com openExternalUrl.
 */
export class NFCeProvider implements ReceiptParserProvider {
  readonly name = 'nfce';

  canHandle(input: ReceiptProcessInput): boolean {
    if (input.source !== 'qr' && !input.qrPayload) return false;
    const payload = input.qrPayload ?? '';
    return /https?:\/\//i.test(payload) || /nfce|nfc-e|chave/i.test(payload);
  }

  async parse(input: ReceiptProcessInput): Promise<ProcessedReceipt> {
    const url = extractUrl(input.qrPayload ?? '');
    if (!url) {
      throw new AppError('QR Code inválido ou sem URL de consulta.');
    }

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.functions.invoke('parse-receipt', {
          body: { mode: 'nfce', qrUrl: url },
        });
        if (!error && data?.rawText) {
          const processed = parseReceiptText(
            String(data.rawText),
            'qr',
            this.name,
          );
          processed.openExternalUrl = url;
          processed.filePath = input.filePath ?? null;
          processed.fileHash = input.fileHash ?? null;
          if (data.blocked) {
            processed.warning =
              'A consulta da SEFAZ não pôde ser lida automaticamente. Você pode abrir a página ou fotografar a nota.';
            processed.openExternalUrl = url;
          }
          return processed;
        }
        if (data?.blocked) {
          return blockedFallback(url, input);
        }
      } catch {
        // fallback abaixo
      }
    }

    // Tentativa leve client-side (muitas SEFAZ bloqueiam CORS/bot)
    try {
      const res = await fetch(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      });
      if (!res.ok) return blockedFallback(url, input);
      const html = await res.text();
      if (/captcha|cloudflare|acesso negado|bot/i.test(html)) {
        return blockedFallback(url, input);
      }
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, '\n');
      const processed = parseReceiptText(text, 'qr', this.name);
      processed.openExternalUrl = url;
      processed.filePath = input.filePath ?? null;
      processed.fileHash = input.fileHash ?? null;
      if (processed.items.length === 0) {
        processed.warning =
          'Não consegui extrair os itens desta NFC-e. Abra a consulta ou use a foto da nota.';
      }
      return processed;
    } catch {
      return blockedFallback(url, input);
    }
  }
}

function extractUrl(payload: string): string | null {
  const match = payload.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

function blockedFallback(
  url: string,
  input: ReceiptProcessInput,
): ProcessedReceipt {
  return {
    merchantName: '',
    merchantDocument: null,
    purchaseDate: null,
    totalInCents: 0,
    discountInCents: 0,
    additionalChargesInCents: 0,
    items: [],
    confidence: 0,
    source: 'qr',
    parserProvider: 'nfce',
    filePath: input.filePath ?? null,
    fileHash: input.fileHash ?? null,
    openExternalUrl: url,
    warning:
      'Não foi possível ler a NFC-e automaticamente (proteção da SEFAZ). Abra a consulta ou fotografe a nota.',
  };
}
