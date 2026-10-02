# Equilibrium — Relatório Fase 4

Leitura real de notas fiscais com OCR/NFC-e, revisão obrigatória, itens categorizados, Storage privado e confirmação atômica.

## OCR provider

| Camada | Detalhe |
|--------|---------|
| Cliente | `OcrEdgeProvider` — sem API key |
| Edge Function | `parse-receipt` (`mode: ocr \| nfce`) |
| Provedor externo | OCR.Space via secret `OCR_SPACE_API_KEY` (servidor) |
| DEMO | `MockReceiptProvider` — R$ 187,42 / 12 itens, sem OCR |

Sem chave configurada, o app falha com fallback amigável (“Tentar novamente” / “Preencher manualmente”).

## Arquitetura

```
UI (capture → processing → review → detail)
  → ReceiptProcessingService
      → MockReceiptProvider | NFCeProvider | OcrEdgeProvider
  → Normalization + ReceiptCategoryEngine
  → Receipt Review (edição)
  → ReceiptRepository.confirm → RPC confirm_receipt
  → Supabase (receipts, receipt_items, transactions, Storage)
```

## Schema

- `receipts` — merchant, data, total, desconto/acréscimo, source, file_path, file_hash, status, parser
- `receipt_items` — raw/normalized, qty, preços, category_key, confidence
- `item_category_preferences` — aprendizado local por usuário
- `transactions.receipt_id` — vínculo opcional (1 despesa = total da nota)

## Storage

- Bucket privado `receipt-files`
- Path: `{user_id}/{yyyy}/{mm}/{receipt-id}.ext`
- Limite 10 MB; MIME: jpeg/png/webp/pdf
- Documento original via **signed URL** curta (não pública)

## RLS

Policies `user_id = auth.uid()` em receipts, receipt_items, preferences.  
Storage: `(storage.foldername(name))[1] = auth.uid()`.  
Script: `npm run test:rls:receipts` → `scripts/rls-receipts.mjs`.

## NFC-e

`NFCeProvider` extrai URL do QR e tenta Edge / fetch.  
Não contorna CAPTCHA/anti-bot. Se bloqueado: aviso + “Abrir consulta” + opção de foto.

## Normalização

`normalizeItemDescription` limpa ruído (`T1`, `CDB`, `UN`…) e mantém `rawDescription`.

## Categorias

Motor determinístico (`ReceiptCategoryEngine`): regras + dicionário.  
Sem LLM nesta fase. Chaves: Mercado, Bebidas, Higiene, Limpeza, Pets, Saúde, Lazer, Outros.

## Preferências

Ao confirmar, associa `normalized_key → category_key` em `item_category_preferences` (upsert). Prioridade sobre regras.

## Duplicidade

`findDuplicateReceipt`: hash de arquivo **ou** merchant+date+total.  
Aviso “parece já ter sido adicionada” com Ver existente / Adicionar mesmo assim.

## Confirmação atômica

RPC `public.confirm_receipt` → `private.confirm_receipt` (SECURITY DEFINER):  
receipt + items + transaction + preferences na mesma transação PL/pgSQL.

## Testes

Unitários: normalização, soma/diferença, categorização, preferências, duplicidade, parser de texto, serialização confirm, mock, path Storage.  
Integração: `scripts/rls-receipts.mjs`.

## Limitações

- OCR depende de secret no Edge; qualidade varia com foto
- PDF: upload + arquitetura; parsing automático limitado
- SEFAZ/NFC-e frequentemente bloqueia bots → fallback
- DEMO não persiste receipt remoto (só despesa local)
- Retenção automática de arquivos originais: futuro (documentado)

## Custos externos

OCR.Space (ou substituto) cobrado pelo volume de chamadas da Edge Function. Cliente não chama o provedor diretamente.

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Dados sensíveis em cupom | Bucket privado, logs sem conteúdo, OCR só via backend |
| Falsa confiança do OCR | Review obrigatória + flag “não tenho certeza” |
| Duplicidade | Aviso, não bloqueio duro |
| SEFAZ instável | Fallback foto/manual |

## Aceite

Fluxo FAB → Escanear → foto/DEMO → review → confirmar → Home/Budget/Movimentações atualizam → “Ver nota fiscal” com itens.
