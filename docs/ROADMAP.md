# Roadmap — Equilibrium

## Fase 1 — Fundação + DS + Onboarding ✅

- Scaffold Expo / TS / Router / Web
- Tokens, tema light/dark/system
- Componentes base
- Onboarding conversacional completo
- Docs + money utils + testes

## Fase 2 — Core financeiro + Dashboard ✅

- Home funcional (saudação, disponível, resumo, orçamentos)
- Nav inferior + FAB
- Movimentações com filtro / editar / excluir
- Planejamento (limites por categoria)
- Persistência local + seed onboarding / DEMO Gabriel
- Controlinho placeholder

## Fase 3 — Supabase + Auth + Sync + RLS ✅ (esta entrega)

- Conta (criar / entrar / sair / recuperar senha)
- Schema + RLS + RPC onboarding
- Repositories + cache local
- Migração local→remoto
- DEMO isolado
- docs de privacidade/segurança

## Fase 4 — Notas fiscais + OCR + QR + categorização ✅

- Captura (foto / galeria / PDF / QR)
- OCR via Edge Function (chave só no servidor)
- NFC-e com fallback SEFAZ
- Review obrigatória + itens categorizados
- Storage privado + RLS + `confirm_receipt` atômico
- Preferências de categoria + anti-duplicidade

## Fase 5 — Controlinho real + tools + IA narrativa ✅

- AssistantOrchestrator + FinancialToolRegistry
- Insights determinísticos
- Mock AI (DEMO) + Edge LLM opcional
- Histórico de conversas com RLS

## Fase 6 — Controlinho contextual + externos + fontes ✅

- Localização opcional (GPS / cidade manual)
- ExternalInformationService + mocks/Edge
- Tools locais/híbridas + histórico de preços
- Cards com fonte · anti prompt-injection

## Fase 7 — Produto diário (metas, recorrências, UX) ✅

- Metas financeiras + projeção determinística
- Despesas recorrentes / vencimentos / calendário
- Projeção do mês + evolução mensal
- Notificações locais + preferências + dedupe
- Home modular, Controlinho visual, microinterações
- Performance (lista paginada), a11y, skeletons/empty
- Exportação JSON/CSV básica
- Release readiness checklist
- **Sem** Open Finance / Pix / exclusão parcial de conta

## Fases futuras

Open Finance, exclusão segura de conta (Edge), push remoto, mapa embutido, EAS store polish.

## Fora de escopo imediato

Pagamentos bancários, compra automática, marketplace, agente autônomo, tracking invasivo.
