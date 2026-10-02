import { preferenceKey } from '@/services/receipts/normalization';

export type CategorySuggestion = {
  categoryKey: string;
  confidence: number;
};

type Rule = { pattern: RegExp; categoryKey: string; confidence: number };

const RULES: Rule[] = [
  { pattern: /\b(arroz|feij[aã]o|macarr[aã]o|farinha|ac[uú]car|sal|óleo|oleo|leite|p[aã]o|queijo|manteiga|iogurte|fruta|banana|carne|frango|ovo|ovos|massa|molho|tempero)\b/i, categoryKey: 'groceries', confidence: 0.86 },
  { pattern: /\b(coca|refrigerante|suco|cerveja|agua mineral|água mineral|energetico|energético|vinho)\b/i, categoryKey: 'beverages', confidence: 0.84 },
  { pattern: /\b(sabonete|shampoo|condicionador|creme dental|pasta de dente|desodorante|absorvente|fio dental|papel higi[eê]nico)\b/i, categoryKey: 'hygiene', confidence: 0.88 },
  { pattern: /\b(detergente|desinfetante|alvejante|amaciante|sab[aã]o em p[oó]|limpeza|esponja|multiuso)\b/i, categoryKey: 'cleaning', confidence: 0.87 },
  { pattern: /\b(ra[cç][aã]o|petisco|areia|coleira|pet)\b/i, categoryKey: 'pets', confidence: 0.9 },
  { pattern: /\b(rem[eé]dio|vitamina|algodo[aã]o|curativo|farmacia|farmácia)\b/i, categoryKey: 'health', confidence: 0.8 },
];

export class ReceiptCategoryEngine {
  constructor(
    private readonly preferences: ReadonlyMap<string, string> = new Map(),
  ) {}

  suggest(
    normalizedDescription: string,
    _merchantName?: string,
  ): CategorySuggestion {
    const key = preferenceKey(normalizedDescription);
    const learned = this.preferences.get(key);
    if (learned) {
      return { categoryKey: learned, confidence: 0.95 };
    }

    for (const rule of RULES) {
      if (rule.pattern.test(normalizedDescription)) {
        return {
          categoryKey: rule.categoryKey,
          confidence: rule.confidence,
        };
      }
    }

    return { categoryKey: 'groceries', confidence: 0.35 };
  }
}
