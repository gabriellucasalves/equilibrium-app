# Equilibrium — Relatório Fase 5

Controlinho real: tools financeiras determinísticas + narrativa por IA (opcional), sem mandar o banco inteiro ao LLM.

## Arquitetura

```
UI Controlinho
  → AssistantOrchestrator
      → Intent router (regras PT-BR)
      → FinancialToolRegistry
      → AssistantContextService (snapshot mínimo)
      → AIProvider (Mock DEMO | Edge LLM)
  → InsightEngine (cards sem LLM)
  → AssistantConversationRepository
```

## AI Provider

| Provider | Uso |
|----------|-----|
| `MockAIProvider` | DEMO / fallback — narra com `tool.summary` |
| `EdgeAIProvider` | Edge `controlinho-chat` + `OPENAI_API_KEY` |

Chave **nunca** no frontend. Sem secret → fallback mock.

## Tools

- `get_month_summary`
- `get_top_categories` / `get_category_spend`
- `get_budget_status`
- `compare_months`
- `get_merchant_spend`
- `get_keyword_spend` (transações + receipt_items)
- `detect_recurring`
- `suggest_savings`

Cálculos em centavos via utils existentes — IA não recalcula.

## Schema

- `assistant_conversations` + `assistant_messages` (RLS `user_id = auth.uid()`)
- Trigger `private.set_assistant_user_id`

## DEMO

Mock AI + dados locais do finance store. Sem chamada OpenAI.

## Privacidade

Prompt recebe só pergunta + resultados compactos de tools.  
Sem dump de transações brutas no system prompt.

## Testes

Intent router, tools, insight engine, mock provider + suite anterior.

## Limitações

- Intent router é heurístico (não function-calling completo no cliente)
- LLM opcional; qualidade depende do secret OpenAI
- Sugestões de economia são regras simples
- Prompt original da Fase 5 chegou truncado na seção 4 — implementação cobre o objetivo declarado (tools + orchestrator + provider)

## Custos

OpenAI (Edge) por mensagem autenticada quando a chave estiver configurada.

## Fora de escopo (respeitado)

Open Finance, promoções externas, agente alterando dados sozinho, LLM substituindo totais.
