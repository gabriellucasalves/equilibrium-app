import { routeIntent } from '@/features/assistant/orchestration/intent-router';

describe('routeIntent', () => {
  it('roteia disponível e limites (financeiro)', () => {
    expect(routeIntent('Quanto ainda posso gastar?').toolCalls[0]?.name).toBe(
      'get_month_summary',
    );
    expect(
      routeIntent('Estou perto de algum limite?').toolCalls.some(
        (c) => c.name === 'get_budget_status',
      ),
    ).toBe(true);
  });

  it('roteia categoria mercado e comparação', () => {
    const cat = routeIntent('Quanto gastei com mercado?');
    expect(cat.toolCalls[0]?.name).toBe('get_category_spend');
    expect(cat.toolCalls[0]?.args?.categoryKey).toBe('groceries');

    const cmp = routeIntent('Como meus gastos estão comparados ao mês passado?');
    expect(cmp.toolCalls.some((c) => c.name === 'compare_months')).toBe(true);
  });

  it('roteia keyword e economia', () => {
    expect(
      routeIntent('Quanto gastei com café nos últimos meses?').toolCalls[0]
        ?.name,
    ).toBe('get_keyword_spend');
    expect(
      routeIntent('Onde eu poderia economizar?').toolCalls.some(
        (c) => c.name === 'suggest_savings',
      ),
    ).toBe(true);
  });

  it('roteia intents locais e híbridas', () => {
    const free = routeIntent('Tem alguma coisa gratuita perto de mim?');
    expect(free.needsLocation).toBe(true);
    expect(free.kind).toMatch(/LOCAL|HYBRID/);
    expect(
      free.toolCalls.some((c) => c.name === 'search_free_activities'),
    ).toBe(true);

    const hybrid = routeIntent(
      'Tenho R$ 100 para lazer. O que posso fazer no fim de semana?',
    );
    expect(hybrid.kind).toBe('HYBRID_FINANCE_LOCAL');
    expect(hybrid.toolCalls.length).toBeLessThanOrEqual(5);
    expect(
      hybrid.toolCalls.some((c) => c.name === 'get_budget_status'),
    ).toBe(true);
    expect(
      hybrid.toolCalls.some((c) => c.name === 'search_local_activities'),
    ).toBe(true);
  });

  it('roteia histórico de produto', () => {
    const hist = routeIntent('Quanto normalmente pago por café?');
    expect(hist.kind).toBe('PRODUCT_HISTORY');
    expect(hist.toolCalls[0]?.name).toBe('get_product_purchase_history');
  });
});
