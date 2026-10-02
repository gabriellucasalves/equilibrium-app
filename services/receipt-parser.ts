/**
 * Contrato do parser de notas — implementação real/mock nas fases seguintes.
 * Confirmação do usuário é obrigatória antes de persistir.
 */
export type ParsedReceiptItem = {
  name: string;
  quantity: number;
  totalCents: number;
};

export type ParsedReceipt = {
  merchantName: string | null;
  purchasedAt: string | null;
  totalCents: number | null;
  items: ParsedReceiptItem[];
  confidence: number;
};

export interface ReceiptParserService {
  parse(input: { imageUri?: string; rawText?: string }): Promise<ParsedReceipt>;
}

/** Stub — não usar em produção. */
export class MockReceiptParserService implements ReceiptParserService {
  async parse(): Promise<ParsedReceipt> {
    return {
      merchantName: null,
      purchasedAt: null,
      totalCents: null,
      items: [],
      confidence: 0,
    };
  }
}
