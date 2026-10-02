# Despesas recorrentes / contas

## Entidade

`recurring_expenses` + store DEMO (`equilibrium-recurring-v1`).

Frequências iniciais: `weekly` | `monthly` | `yearly` (priorizar mensal).

Valor pode ser fixo (`amount_cents`) ou aproximado (`estimated_amount_cents`).

## Princípio

Recorrência = **planejamento**. Não vira pagamento automático.

Ao vencer: Registrar pagamento (abre formulário de transação pré-preenchido) · Adiar · Dispensar este mês.

Após confirmar a transação, `next_due_date` avança.

## Detecção

Tool `detect_recurring` sugere padrões; transformação em recorrente exige confirmação do usuário.

## Calendário e projeção

Planejamento → Calendário (lista cronológica).

`get_month_projection` / card: disponível agora − contas previstas = disponível projetado (estimativa).
