# Database — Equilibrium

Backend: **Supabase PostgreSQL** + Auth + RLS.

## Tabelas (Fase 3 + 4)

| Tabela | Escopo |
|--------|--------|
| `profiles` | nome, `onboarding_completed` |
| `financial_profiles` | `monthly_income_cents`, `income_type` |
| `categories` | sistema (`user_id` null) + custom futuras |
| `transactions` | movimentações (`amount_cents`, `transaction_date` DATE, `receipt_id` opcional) |
| `budgets` | limites unique `(user_id, category_key, month, year)` |
| `user_migrations` | marcador migração local→remoto |
| `receipts` | nota fiscal confirmada (merchant, total, file_path/hash, status) |
| `receipt_items` | itens da nota (raw/normalized, preços, category_key) |
| `item_category_preferences` | aprendizado `normalized_key → category_key` |
| `assistant_conversations` | conversas do Controlinho |
| `assistant_messages` | mensagens + `tool_names` |

## Storage

Bucket privado `receipt-files` — path `{user_id}/{yyyy}/{mm}/{id}.ext`.

## Índices

- `transactions (user_id, transaction_date DESC)` where not deleted
- `budgets (user_id, year, month)`

## RLS

Ativado em todas as tabelas acima. Policies: `user_id = auth.uid()` (categorias sistema: leitura para autenticados).

## RPC

`public.complete_onboarding(...)` → `private.complete_onboarding` (SECURITY DEFINER) — grava perfil, renda, budgets e txs atomicamente.

`public.confirm_receipt(...)` → `private.confirm_receipt` (SECURITY DEFINER) — grava receipt + items + transaction + preferências atomicamente.

Conversas: insert com `user_id` do auth + trigger `private.set_assistant_user_id`.

## Migrations

```bash
# Arquivos versionados
supabase/migrations/

# Aplicar em projeto remoto (CLI ou MCP)
supabase db push
# ou apply_migration via MCP
```

Seed dev: `supabase/seed.sql` (somente categorias).

## Dinheiro e datas

- Centavos: `BIGINT`
- Dia da compra: `DATE` civil (evita shift UTC)
