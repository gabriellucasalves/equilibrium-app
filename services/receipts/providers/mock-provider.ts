import { createId } from '@/utils/id';
import { toISODate } from '@/utils/date';
import { ReceiptCategoryEngine } from '@/services/receipts/category-engine';
import { normalizeItemDescription } from '@/services/receipts/normalization';
import type {
  ProcessedReceipt,
  ReceiptParserProvider,
  ReceiptProcessInput,
} from '@/services/receipts/types';

const DEMO_LINES = [
  { raw: 'ARROZ T1 5KG CDB', qty: 1, total: 2490 },
  { raw: 'SABONETE NEUTRO 90G', qty: 2, total: 850 },
  { raw: 'DETERGENTE LIQ 500ML', qty: 1, total: 1200 },
  { raw: 'RACAO CAES 1KG', qty: 1, total: 3600 },
  { raw: 'COCA COLA LT 350', qty: 2, total: 1190 },
  { raw: 'FEIJAO CARIOCA 1KG', qty: 1, total: 899 },
  { raw: 'LEITE UHT INTEGRAL', qty: 2, total: 1050 },
  { raw: 'PAPEL HIGIENICO 12UN', qty: 1, total: 1890 },
  { raw: 'BANANA PRATA KG', qty: 1.2, total: 720 },
  { raw: 'SHAMPOO 350ML', qty: 1, total: 1590 },
  { raw: 'DESINFETANTE 2L', qty: 1, total: 1299 },
  { raw: 'QUEIJO MUSSARELA 200G', qty: 1, total: 1964 },
];

/** Soma = 18742 centavos (R$ 187,42) */
export class MockReceiptProvider implements ReceiptParserProvider {
  readonly name = 'mock';

  canHandle(input: ReceiptProcessInput): boolean {
    return Boolean(input.isDemo) || input.source === 'demo';
  }

  async parse(input: ReceiptProcessInput): Promise<ProcessedReceipt> {
    const engine = new ReceiptCategoryEngine();
    const items = DEMO_LINES.map((line) => {
      const normalized = normalizeItemDescription(line.raw);
      const suggestion = engine.suggest(normalized, 'Supermercado ABC');
      const unit =
        line.qty > 0 ? Math.round(line.total / line.qty) : line.total;
      return {
        id: createId('ri'),
        rawDescription: line.raw,
        normalizedDescription: normalized,
        quantity: line.qty,
        unitPriceInCents: unit,
        totalPriceInCents: line.total,
        categoryKey: suggestion.categoryKey,
        confidence: suggestion.confidence,
        uncertain: suggestion.confidence < 0.5,
      };
    });

    return {
      merchantName: 'Supermercado ABC',
      merchantDocument: '12.345.678/0001-90',
      purchaseDate: toISODate(),
      totalInCents: 18742,
      discountInCents: 0,
      additionalChargesInCents: 0,
      items,
      confidence: 0.92,
      source: input.source === 'demo' ? 'demo' : input.source,
      parserProvider: this.name,
      filePath: input.filePath ?? null,
      fileHash: input.fileHash ?? null,
      warning: null,
    };
  }
}
