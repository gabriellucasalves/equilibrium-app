# AI Assistant — Controlinho

## Papel

Assistente financeiro próximo e calmo. Explica o mês em linguagem simples. Sem julgamento.

## Arquitetura (Fase 5)

```
Usuário
  → Controlinho UI
  → AssistantOrchestrator
  → Tool Router (intent)
  → Financial Tools → Repositories / FinanceStore
  → Resultado estruturado
  → AIProvider (Mock | Edge LLM)
  → Resposta explicada
```

Insights determinísticos (`InsightEngine`) aparecem na home do assistente **antes** da conversa.

## Princípios

1. Insights e totais determinísticos — LLM só narra
2. Nunca enviar o banco inteiro no prompt
3. Tools mockáveis / testáveis em isolamento
4. Chave de IA só no servidor (`OPENAI_API_KEY`)
5. DEMO usa `MockAIProvider`
6. Tom alinhado à personalidade Equilibrium

## Estrutura de código

```
features/assistant/
  orchestration/   AssistantOrchestrator + intent-router
  tools/           FinancialToolRegistry + tools
  prompts/         system prompt
  providers/       Mock + Edge
  components/      chat, avatar, insights
  repositories/    conversas Supabase
  services/        context + insight engine
  types.ts
```

## Moods do mascote

`idle` | `thinking` | `happy` | `alert` | `speaking`
