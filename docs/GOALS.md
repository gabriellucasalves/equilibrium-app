# Metas financeiras

## Entidade

`financial_goals` (Supabase) + store local DEMO (`equilibrium-goals-v1`).

Campos: `name`, `target_amount_cents`, `current_amount_cents`, `target_date?`, `icon_key?`, `status`.

Status: `active` | `completed` | `paused` | `archived`.

## Fluxo

Planejamento → Metas → Nova meta → contribuição opcional (+ valor).

Contribuição é **reserva conceitual** — não cria transferência bancária nem transação.

## Progresso

`utils/goals.ts`: percentual, restante e projeção determinística.

Controlinho tools: `get_goals`, `get_goal_progress`, `calculate_goal_projection`.

Projeções usam linguagem de estimativa (“por volta de…”), nunca certeza falsa.
