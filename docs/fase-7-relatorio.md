# Relatório — Fase 7

## Entrega

Produto diário mais maduro: metas, recorrências, calendário, projeção do mês, notificações locais, evolução mensal, exportação básica, UX/a11y/perf, Controlinho visual, onboarding com foco opcional.

## Metas

- Schema `financial_goals` + store DEMO/remoto
- UI em Planejamento → Metas
- Contribuição conceitual
- Tools Controlinho: `get_goals`, `get_goal_progress`, `calculate_goal_projection`

## Recorrências

- Schema `recurring_expenses`
- Contas com vencimento / ações Registrar · Adiar · Dispensar
- Prefill no formulário de transação + avanço de `next_due_date` após salvar
- Calendário cronológico + `ProjectionCard` / `get_month_projection`

## Notificações

- Locais com dedupe
- Preferências em Perfil → Notificações
- Pedido contextual de permissão

## UX / Controlinho

- Home modular (saudação → card → insight → limites → contas → recentes)
- Avatar com moods idle/thinking/searching/celebrating/warning/sleeping (+ legado)
- Microinterações + haptics suaves + Reduce Motion
- Skeletons / EmptyState / ErrorState
- Onboarding: passo opcional de objetivo principal

## Performance

- FlatList paginada em Movimentações (batch 30)

## Acessibilidade

- Labels, status textual, targets, teclado, safe area

## Exportação

- JSON e CSV (transações, budgets, goals, recorrências)
- Limitações LGPD documentadas

## Release readiness

- Checklist em `docs/RELEASE_READINESS.md`
- Exclusão de conta **fora** desta fase (segurança)

## Testes

Utils: goals, recurring, month projection, export, pagination, notif dedupe  
Tools + insight priorities

## Limitações / riscos

- Sem push remoto / Open Finance / Pix
- Exclusão de conta não shipada
- Resumo semanal: preferência existe; scheduling semanal rico pode evoluir
- QA VoiceOver/TalkBack em device físico pendente
- Push remoto e EAS stores fora do escopo

## Fora de escopo (respeitado)

Open Finance, Pix, pagamentos, compra automática, marketplace, agente autônomo.
