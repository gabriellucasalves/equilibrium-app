# Performance

## Listas

Movimentações: `FlatList` com batch de 30 (`PAGE_SIZE`), `onEndReached`, `windowSize` limitado.

## Cache / stores

Zustand + AsyncStorage para finance, goals, recurring, prefs.

Invalidação natural: mutações atualizam o store imediatamente (create/update/delete/contribute/pagamento recorrente).

## Home

Uma insight principal; seções modulares (`HomeSections`) sem dashboard inchado.

## Receipts / chat

Sem mudança de arquitetura das fases 4–6; detalhes grandes de nota seguem sob demanda.

## Critério

~1000 transactions: tela Movimentações não monta todos os itens de uma vez.
