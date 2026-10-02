# Acessibilidade

## Práticas desta fase

- Labels em FAB, metas, contas, toggles de notificação, avatar Controlinho
- Status não só por cor (texto “Atenção” / “Positivo” nos insights)
- Touch targets ≥ ~44–48px em toggles e opções de onboarding
- `Screen` com Safe Area + KeyboardAvoidingView
- Reduce Motion respeitado em haptics e animações do Controlinho
- FlatList em Movimentações (menos pressão em TalkBack/VoiceOver com listas enormes)
- Fonte: layouts com `flexGrow` / minHeight em vez de cortar conteúdo

## Web

Focus/hover nos botões e chips existentes; navegação por teclado nos formulários modais.

## Limitações

Auditoria completa VoiceOver/TalkBack em dispositivos físicos ainda pendente de QA de release.
