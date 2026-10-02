# Architecture — Equilibrium

## Princípio

App financeiro calmo e modular: o usuário entende o dinheiro sem jargão. Camadas claras, domínio por feature, dinheiro em centavos.

## Stack

- **App:** Expo + React Native + Expo Router + React Native Web + TypeScript
- **Estado local:** Zustand + AsyncStorage
- **Backend (próximas fases):** Supabase (Postgres, Auth, Storage, RLS)
- **Deploy:** Vercel (web), EAS (mobile)

## Camadas

```
app/            → rotas (UI navigation)
components/ui/  → design system
features/       → fluxos de produto por domínio
hooks/ + store/ → estado e preferências
services/       → regras e integrações (stubs na F1)
utils/ + types/ → primitives (money, etc.)
database/       → schemas / migrations (evolução)
```

## Navegação

- `/` redireciona para onboarding ou app conforme `completed`
- `(onboarding)/*` — fluxo conversacional
- `(app)/(tabs)/*` — Início, Movimentações, Controlinho, Planejamento, Perfil
- `(app)/transaction/form` — criar/editar movimentação (modal)
- FAB global no layout das tabs

## Dinheiro

Todos os valores monetários internos são **inteiros em centavos**. Formatação BRL só na borda da UI (`utils/money.ts`).

## Tema

Tokens em `constants/tokens.ts`. Preferência `light | dark | system` no store. `AppThemeProvider` resolve o esquema efetivo.

## Agente (futuro)

```
FinancialContextService → InsightEngine → AssistantOrchestrator → AI Provider → Tools
```

Frontend nunca embute API keys de IA.

## Estado financeiro local (Fase 2)

Store `useFinanceStore` (`equilibrium-finance-v1`):

- `displayName`, `monthlyIncomeCents`
- `budgets[]`, `transactions[]`
- Seed ao concluir onboarding; opção DEMO Gabriel no Perfil

Resumo do mês: `utils/finance-summary.ts` (receitas − despesas em centavos).

## Auth + sync (Fase 3)

- `useAuthStore` — sessão, profile, demo, migração
- `createSupabaseRepositories()` — transactions, budgets, profiles, onboarding, receipts, goals, recurring
- Escrita otimista no `useFinanceStore` com rollback
- UI não importa Supabase diretamente (exceto bootstrap)

## Metas e recorrências (Fase 7)

- Stores `useGoalsStore` / `useRecurringStore` (DEMO local ou Supabase)
- Planejamento: Orçamentos | Metas | Contas | Calendário | Evolução
- Projeção: `utils/month-projection.ts` (disponível − contas previstas)
- Notificações locais: `features/notifications/*` + prefs Zustand
- Home modular: `features/dashboard/HomeSections.tsx`
- Exportação: `utils/export-data.ts` (JSON/CSV)

## Notas fiscais (Fase 4)

```
UI → ReceiptCapture → ReceiptProcessingService → Providers
  → Normalization / CategoryEngine → Review → ReceiptRepository → confirm_receipt
```

- Providers: Mock (DEMO), OcrEdge, NFCe
- Storage privado `receipt-files` + signed URL

## Controlinho (Fase 5–6)

```
UI → AssistantOrchestrator → Financial + External tools → AIProvider
```

- LLM nunca recalcula totais; só explica `toolResults`
- Externos sempre com `sourceName` / `sourceUrl` / `retrievedAt`
- DEMO: Mock AI + Mock External (sem rede)

## Fase atual

**Fase 7:** Metas, recorrências, notificações locais, UX/perf/a11y, exportação básica.
