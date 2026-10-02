# Privacidade e Segurança — Equilibrium (técnico)

Documento técnico inicial (não é política jurídica final).

## Quais dados existem

| Dado | Onde | Por quê |
|------|------|---------|
| E-mail / senha | Supabase Auth | Conta e sessão |
| Nome | `profiles` | Saudação e perfil |
| Renda mensal | `financial_profiles` | Cálculo de disponível |
| Orçamentos | `budgets` | Limites por categoria/mês |
| Transações | `transactions` | Movimentações do mês |
| Notas fiscais | `receipts` + `receipt_items` | Detalhamento da compra |
| Arquivos de nota | Storage `receipt-files` (privado) | Documento original |
| Preferências de categoria | `item_category_preferences` | Aprendizado de classificação |
| Conversas do Controlinho | `assistant_conversations` / `assistant_messages` | Histórico do assistente |
| Preferência de localização | AsyncStorage local | cidade/UF ou modo GPS |
| Recomendações salvas | AsyncStorage local | cards externos salvos pelo usuário |
| Preferência de tema | AsyncStorage local | UX |
| Metas financeiras | `financial_goals` / AsyncStorage DEMO | planejamento de reserva conceitual |
| Contas recorrentes | `recurring_expenses` / AsyncStorage DEMO | vencimentos / projeção |
| Preferências de notificação | AsyncStorage local | lembretes locais + dedupe |
| Foco do onboarding | AsyncStorage (+ `profiles.primary_focus`) | preferência de UX |
| Cache financeiro | AsyncStorage (por sessão) | Offline parcial / performance |
| Cache de busca externa | memória do app (TTL) | reduzir chamadas; sem coords persistidas |

## Notas fiscais e LGPD

Notas podem conter CPF/CNPJ, endereço, hábitos de consumo e dados sensíveis de compra.

- Arquivos ficam em bucket **privado**; path começa com `user_id`.
- Acesso ao original só via **signed URL** de curta duração.
- Processamento OCR/NFC-e passa por **Edge Function**; chave do provedor fica no servidor.
- Enviamos ao OCR apenas a imagem/PDF necessária — não dados de conta extras.
- Preferências derivadas (`item_category_preferences`) são do usuário e isoladas por RLS.
- Exclusão: ao apagar movimentação, o usuário escolhe manter ou excluir a nota (e o arquivo).

### Retenção (futuro)

Não há hoje exclusão automática agressiva de arquivos.  
Necessidade futura documentada: opção de apagar o arquivo original mantendo dados estruturados (merchant/itens/total), se o usuário preferir.

## Isolamento

- Tabelas financeiras e de notas têm **RLS** com `user_id = auth.uid()`.
- Storage: usuário A não lista/baixa/altera/exclui arquivo de B.
- O frontend nunca é a única barreira de autorização.
- Modo DEMO fica só no dispositivo e **não sincroniza** / **não chama OCR real** por padrão.

## Tokens e segredos

- App usa apenas `EXPO_PUBLIC_SUPABASE_URL` + anon/publishable key.
- Service role, `OCR_SPACE_API_KEY` e chaves de IA **nunca** no cliente.
- Não logamos senha, tokens, imagem completa, CPF, chave de acesso NFC-e completa nem itens detalhados em produção.

## Localização (Fase 6)

- Opcional; pedida só quando a pergunta exige “perto de mim”.
- Preferência: `city` / `state` / `country` — sem persistir lat/lng.
- Coordenadas (se GPS) só em memória para distância; não vão ao LLM.
- Detalhes: [LOCATION_PRIVACY.md](./LOCATION_PRIVACY.md).

## Fornecedores externos

| Fornecedor | Dados enviados | Finalidade |
|------------|----------------|------------|
| OCR.Space (via Edge) | Imagem/PDF da nota | Extração de texto |
| OpenAI (via Edge `controlinho-chat`) | Pergunta + resultados compactos de tools | Narrativa |
| Nominatim/OSM (via Edge `external-search`) | cidade/UF + termo | lugares públicos |
| Provider de preços (opcional) | termo + região | promoções/preços |

- Chaves só como secrets da Edge.
- DEMO: mocks locais, sem chamadas externas por padrão.
- Conteúdo web tratado como não confiável ([EXTERNAL_DATA_SECURITY.md](./EXTERNAL_DATA_SECURITY.md)).
- Usuário controla flags/modos; pode desligar localização e busca.

## Logs

- Em desenvolvimento, erros técnicos podem ir para `console.warn`.
- Em produção, mensagens ao usuário são amigáveis (`mapErrorToUserMessage`).
- Proibido logar conteúdo integral da nota ou imagem em base64.

## Exportação (Fase 7)

- Perfil → Exportar meus dados (JSON ou CSV).
- Inclui transações, orçamentos, metas e recorrências do dispositivo/sessão.
- **Não** é exportação jurídica LGPD completa (sem logs de auth, storage files, conversas, etc.).

## Notificações

- Locais no aparelho; sem push remoto nesta fase.
- Permissão pedida com contexto; preferências desligáveis.

## Futuro

- **Exclusão de conta:** Edge Function com service role + reautenticação (não shipada parcialmente).
- **Exportação LGPD ampliada:** incluir conversas, receipts files, etc.
- **Retenção seletiva** de arquivos originais vs. dados estruturados.

## Validação RLS

- Transações: `scripts/rls-two-users.mjs`
- Notas + Storage: `scripts/rls-receipts.mjs`
