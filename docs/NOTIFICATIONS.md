# Notificações locais

## Escopo Fase 7

Somente notificações **locais/scheduled** (`expo-notifications`). Sem backend push.

## Tipos

- Conta vence amanhã / hoje
- Budget 80% / 100%
- Meta atingida
- Resumo semanal (preferência, off por padrão)
- Sugestões Controlinho (preferência, off por padrão)

## Deduplicação

Chaves em `notification-preferences-store.sentKeys` (ex.: `due:{id}:{date}:{urgency}`).

## Preferências

Perfil → Notificações. Horário preferido padrão 09:00; faixa 08–21.

## Permissão

Pedida com contexto (ex.: após criar conta recorrente), não no primeiro launch.
