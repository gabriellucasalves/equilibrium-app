# Relatório — Fase 3 (Supabase + Auth + Sync)

## Resumo

Equilibrium passou de app local para app com **contas reais**, **Postgres + RLS** e **cache local**. UI das Fases 1–2 preservada; DEMO isolado.

## Arquitetura

```
UI → AuthStore / FinanceStore → Repository interfaces
   → SupabaseRepository | cache local → Supabase
```

## Supabase

- Projeto: `equilibrium` (`neorhxivlamgxxcickkx`, região `sa-east-1`)
- Auth e-mail/senha + recuperação
- Client único: `lib/supabase/client.ts` (AsyncStorage, auto refresh)

## Schema / RLS

Migrations em `supabase/migrations/`. RLS ativo em profiles, financial_profiles, categories, transactions, budgets, user_migrations.

Validação: usuário A criou “Supermercado RLS”; usuário B viu **0** linhas sob role `authenticated`.

## Auth flow

loading → unauthenticated → (migrate?) → onboarding? → dashboard  
DEMO: entrada sem conta, sem sync.

## Migração local→remoto

Tela `/(auth)/migrate` com proteção `user_migrations.local_migration_completed`.

## Sync / offline

Escrita otimista + rollback. Sem fila offline completa: mensagem *"Não foi possível salvar agora. Verifique sua conexão."*

## Testes / qualidade

- `npm test` — 15 passed  
- `npm run typecheck` / `lint` — ok  
- `npx expo export --platform web` — ok  

## Decisões

- `transaction_date` como DATE  
- Onboarding remoto via RPC atômica  
- DEMO nunca sincroniza  

## Limitações

- Sem OAuth social / biometria  
- Sem exclusão completa de conta  
- Sem fila offline robusta  
- Confirmação de e-mail depende das settings do projeto Auth  

## Pendências / riscos

- Habilitar “Leaked password protection” no dashboard Auth  
- Confirmar e-mail em produção  
- Exclusão/exportação LGPD  

## Próxima fase

OCR / IA / Controlinho real — **somente sob nova solicitação**.
