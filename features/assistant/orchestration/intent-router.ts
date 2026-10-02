import { ASSISTANT_LIMITS } from '@/constants/feature-flags';
import type { ToolArgs } from '@/features/assistant/tools/types';

export type AssistantIntentKind =
  | 'FINANCE'
  | 'LOCAL_ACTIVITY'
  | 'LOCAL_FREE_ACTIVITY'
  | 'LOCAL_PLACE'
  | 'PRODUCT_PRICE'
  | 'PROMOTION'
  | 'PUBLIC_SERVICE'
  | 'HYBRID_FINANCE_LOCAL'
  | 'PRODUCT_HISTORY';

export type RoutedIntent = {
  kind: AssistantIntentKind;
  toolCalls: { name: string; args?: ToolArgs }[];
  needsLocation: boolean;
  categoryHint?: string;
};

const CATEGORY_ALIASES: { pattern: RegExp; categoryKey: string; label: string }[] =
  [
    { pattern: /\b(mercado|supermercado|alimenta[cç][aã]o|feira)\b/i, categoryKey: 'groceries', label: 'Mercado' },
    { pattern: /\b(bebida|bebidas|cerveja|refrigerante)\b/i, categoryKey: 'beverages', label: 'Bebidas' },
    { pattern: /\b(higiene|sabonete|shampoo)\b/i, categoryKey: 'hygiene', label: 'Higiene' },
    { pattern: /\b(limpeza|detergente)\b/i, categoryKey: 'cleaning', label: 'Limpeza' },
    { pattern: /\b(pet|pets|ra[cç][aã]o)\b/i, categoryKey: 'pets', label: 'Pets' },
    { pattern: /\b(transporte|uber|99|combust[ií]vel|gasolina)\b/i, categoryKey: 'transport', label: 'Transporte' },
    { pattern: /\b(lazer|streaming|cinema)\b/i, categoryKey: 'leisure', label: 'Lazer' },
    { pattern: /\b(sa[uú]de|farm[aá]cia|plano)\b/i, categoryKey: 'health', label: 'Saúde' },
    { pattern: /\b(moradia|aluguel)\b/i, categoryKey: 'housing', label: 'Moradia' },
    { pattern: /\b(energia|luz)\b/i, categoryKey: 'energy', label: 'Energia' },
    { pattern: /\b(internet)\b/i, categoryKey: 'internet', label: 'Internet' },
  ];

/** Roteador determinístico — máx. N tools por turno. */
export function routeIntent(question: string): RoutedIntent {
  const q = question.trim();
  const lower = q.toLowerCase();
  const budgetMention = extractBudgetCents(lower);

  const localCue =
    /perto de mim|perto daqui|pr[oó]xim[oa]s? (a|de) mim|na minha regi[aã]o|fim de semana|s[aá]bado|domingo|passeio|o que (posso|d[aá]) fazer|tem (alguma )?coisa|atividade(s)? (barata|gratuita)|parque perto|promo[cç].*perto|barato perto/i.test(
      lower,
    ) ||
    (/\b(parque|museu|biblioteca)\b/i.test(lower) &&
      /\b(tem|onde|perto|pr[oó]xim)\b/i.test(lower));

  if (
    /quanto normalmente pago|hist[oó]rico.*(caf[eé]|produto)|m[eé]dia.*(caf[eé]|pre[cç]o)/i.test(
      lower,
    )
  ) {
    const keyword =
      lower.match(/\b(caf[eé]|arroz|leite|p[aã]o)\b/i)?.[1] ?? 'café';
    return limit({
      kind: 'PRODUCT_HISTORY',
      needsLocation: false,
      toolCalls: [
        { name: 'get_product_purchase_history', args: { keyword } },
      ],
    });
  }

  if (
    /promo[cç]|oferta|mais barato perto|caf[eé] barato|pre[cç]o.*(perto|regi[aã]o)/i.test(
      lower,
    )
  ) {
    const keyword =
      lower.match(/\b(caf[eé]|arroz|leite|feij[aã]o)\b/i)?.[1] ?? undefined;
    return limit({
      kind: 'PROMOTION',
      needsLocation: true,
      toolCalls: [
        ...(keyword
          ? [{ name: 'get_product_purchase_history', args: { keyword } }]
          : []),
        {
          name: keyword ? 'search_product_prices' : 'search_promotions',
          args: { query: keyword },
        },
        { name: 'get_budget_status' },
      ],
    });
  }

  if (/servi[cç]o p[uú]blico|prefeitura|biblioteca|posto de sa[uú]de/i.test(lower)) {
    return limit({
      kind: 'PUBLIC_SERVICE',
      needsLocation: true,
      toolCalls: [{ name: 'search_public_services' }],
    });
  }

  if (
    /parque|museu|biblioteca|centro cultural|pra[cç]a/i.test(lower) &&
    /perto|pr[oó]xim|onde|tem\b/i.test(lower)
  ) {
    const category = /parque/i.test(lower)
      ? 'park'
      : /museu/i.test(lower)
        ? 'museum'
        : /biblioteca/i.test(lower)
          ? 'library'
          : 'public_space';
    return limit({
      kind: 'LOCAL_PLACE',
      needsLocation: true,
      toolCalls: [
        { name: 'search_local_places', args: { category, query: category } },
        { name: 'get_budget_status' },
      ],
    });
  }

  if (
    /gratuit[oa]s?|gr[aá]tis|sem gastar|sem gastar muito|n[aã]o gastar|gastando at[eé]/i.test(
      lower,
    ) &&
    localCue
  ) {
    const max =
      budgetMention ??
      (/sem gastar|gratuit[oa]s?|gr[aá]tis/i.test(lower) ? 0 : undefined);
    return limit({
      kind: budgetMention != null ? 'HYBRID_FINANCE_LOCAL' : 'LOCAL_FREE_ACTIVITY',
      needsLocation: true,
      toolCalls: [
        { name: 'get_budget_status' },
        {
          name: max === 0 ? 'search_free_activities' : 'search_local_activities',
          args: max !== undefined ? { maxPriceInCents: max } : undefined,
        },
      ],
    });
  }

  if (
    localCue &&
    /(fazer|passeio|sair|atividade|fim de semana|ideias|lazer)/i.test(lower)
  ) {
    return limit({
      kind: 'HYBRID_FINANCE_LOCAL',
      needsLocation: true,
      toolCalls: [
        { name: 'get_budget_status' },
        { name: 'get_month_summary' },
        {
          name: 'search_local_activities',
          args:
            budgetMention !== undefined
              ? { maxPriceInCents: budgetMention }
              : undefined,
        },
      ],
    });
  }

  // —— intents financeiros (Fase 5) ——
  if (/economiz|onde posso cortar|reduzir gasto|poupar/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'suggest_savings' },
        { name: 'get_top_categories' },
        { name: 'get_budget_status' },
      ],
    });
  }

  if (/meta|objetivo financeiro|reserva|juntar dinheiro|poupan[cç]a/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'get_goals' },
        { name: 'get_goal_progress' },
        { name: 'calculate_goal_projection' },
      ],
    });
  }

  if (/proje[cç][aã]o|contas previstas|dispon[ií]vel projetado/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'get_month_projection' },
        { name: 'get_month_summary' },
      ],
    });
  }

  if (/recorrente|todo m[eê]s|assinatura|conta/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'detect_recurring' },
        { name: 'get_month_projection' },
      ],
    });
  }

  if (/compar|m[eê]s passado|aumentou|diminuiu|versus|vs\b/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'compare_months' },
        { name: 'get_top_categories' },
      ],
    });
  }

  if (/limite|or[cç]amento|perto de|estour|budget/i.test(lower) && !localCue) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [{ name: 'get_budget_status' }],
    });
  }

  if (/posso gastar|dispon[ií]vel|sobra|livre/i.test(lower) && !localCue) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'get_month_summary' },
        { name: 'get_budget_status' },
      ],
    });
  }

  const merchant =
    extractQuoted(q) ?? extractAfter(q, /(?:no|na|em)\s+(?:o\s+|a\s+)?(.+)$/i);
  if (
    /supermercado|mercado\s+\w+|estabelecimento|loja|padaria|farm[aá]cia\s+\w+/i.test(
      lower,
    ) ||
    (/gastei (?:no|na|em)\b/i.test(lower) && merchant && merchant.length > 2)
  ) {
    const name =
      extractQuoted(q) ?? merchant?.replace(/\?$/, '').trim() ?? '';
    if (name && !CATEGORY_ALIASES.some((a) => a.pattern.test(name))) {
      return limit({
        kind: 'FINANCE',
        needsLocation: false,
        toolCalls: [
          { name: 'get_merchant_spend', args: { merchant: name } },
          { name: 'get_month_summary' },
        ],
      });
    }
  }

  if (/caf[eé]|uber|ifood|gasolina|cerveja|pizza/i.test(lower) && !localCue) {
    const keyword =
      lower.match(/\b(caf[eé]|uber|ifood|gasolina|cerveja|pizza)\b/i)?.[1] ??
      '';
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'get_keyword_spend', args: { keyword } },
        { name: 'get_product_purchase_history', args: { keyword } },
      ],
    });
  }

  for (const alias of CATEGORY_ALIASES) {
    if (alias.pattern.test(lower) && /gast|quanto|categoria/i.test(lower)) {
      return limit({
        kind: 'FINANCE',
        needsLocation: false,
        categoryHint: alias.categoryKey,
        toolCalls: [
          {
            name: 'get_category_spend',
            args: { categoryKey: alias.categoryKey, label: alias.label },
          },
          { name: 'get_month_summary' },
        ],
      });
    }
  }

  if (/onde.*gast|mais gast|categorias|distribu/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'get_top_categories' },
        { name: 'get_month_summary' },
      ],
    });
  }

  if (/quanto gastei|gastos?\s+(deste|desse|este|esse)?\s*m[eê]s|total/i.test(lower)) {
    return limit({
      kind: 'FINANCE',
      needsLocation: false,
      toolCalls: [
        { name: 'get_month_summary' },
        { name: 'get_top_categories' },
      ],
    });
  }

  return limit({
    kind: 'FINANCE',
    needsLocation: false,
    toolCalls: [
      { name: 'get_month_summary' },
      { name: 'get_top_categories' },
      { name: 'get_budget_status' },
    ],
  });
}

function limit(intent: RoutedIntent): RoutedIntent {
  return {
    ...intent,
    toolCalls: intent.toolCalls.slice(0, ASSISTANT_LIMITS.maxToolCallsPerTurn),
  };
}

function extractBudgetCents(lower: string): number | undefined {
  const m = lower.match(
    /(?:r\$\s*|até\s+|ate\s+|tenho\s+)?(\d{1,5})(?:[.,](\d{2}))?\s*(?:reais)?/,
  );
  if (!m) return undefined;
  const reais = Number(m[1]);
  const cents = m[2] ? Number(m[2]) : 0;
  if (!Number.isFinite(reais)) return undefined;
  return reais * 100 + cents;
}

function extractQuoted(text: string): string | null {
  const m = text.match(/[“"]([^”"]+)[”"]/) ?? text.match(/'([^']+)'/);
  return m?.[1]?.trim() || null;
}

function extractAfter(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m?.[1]?.trim() || null;
}
