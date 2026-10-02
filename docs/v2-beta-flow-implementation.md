# V2 Beta fechado — implementação do fluxo aprovado

Branch: `feature/closed-test-v2`

## Objetivo

Implementar somente o caminho aprovado por UX + QA para o primeiro teste de usabilidade:

1. Começar.
2. Informar renda ou pular.
3. Escolher uma conta.
4. Registrar um valor contextual.
5. Ler na Home quanto recebeu, quanto gastou e quanto ainda tem.

Nenhuma feature avançada foi removida do projeto; o modo fechado apenas não as coloca no caminho crítico.

## Feature flag

```env
EXPO_PUBLIC_CLOSED_TEST_MODE=true
```

Quando ligada:

- a tela de login não aparece antes do teste;
- Auth/Supabase continuam no projeto;
- o fluxo usa dados financeiros locais;
- dados DEMO não são carregados;
- a primeira execução da V2 limpa o estado financeiro/local anterior uma única vez;
- o banco remoto não é apagado;
- o FAB global fica oculto no caminho fechado.

## Fluxo

### Welcome

`app/(onboarding)/welcome.tsx`

- Equilibrium
- “Vamos organizar seu dinheiro?”
- CTA único: “Começar”

### Renda

`app/(onboarding)/income.tsx`

- “Quanto você recebe por mês?”
- valor monetário em centavos
- “Continuar”
- “Prefiro informar depois”

Pular a renda ainda leva à escolha da conta. Se a tela for aberta a partir da Home, salvar renda volta para a Home.

### Escolha da conta

`app/(onboarding)/account-choice.tsx`

Opções visíveis:

- Luz
- Água
- Mercado
- Aluguel
- Combustível

“Outra conta” não aparece nesta V2.

“Agora não” conclui o caminho sem criar transação.

### Registro contextual

`app/(onboarding)/account-amount.tsx`

Perguntas aprovadas:

- Luz: “Quanto veio sua conta de luz?”
- Água: “Quanto veio sua conta de água?”
- Mercado: “Quanto você gastou no mercado?”
- Aluguel: “Quanto veio o aluguel?”
- Combustível: “Quanto você gastou com combustível?”

Mapeamento interno, invisível para a pessoa:

- Luz → `energy`
- Água → `water`
- Mercado → `groceries`
- Aluguel → `housing`
- Combustível → `transport`

Valor vazio/zero não habilita Salvar. “Agora não” não grava zero.

## Home fechada

`features/closed-test/ClosedTestHome.tsx`

A primeira leitura contém somente:

- Olá.
- Recebi (quando a renda existe)
- Gastei
- Ainda tenho (somente quando a renda existe)
- uma frase curta do Controlinho
- Seu mês

Sem renda:

- “Renda — Ainda não informada”
- botão “Informar renda”
- “Gastei” continua funcionando
- nenhum saldo disponível é inventado

A seção “Seu mês” mostra as cinco contas com valor registrado ou “Adicionar”.

## Isolamento do teste

`features/closed-test/reset.ts`

A chave local `equilibrium-closed-test-v2-initialized` garante que a limpeza automática aconteça uma única vez para a V2.

A limpeza afeta apenas stores locais. Nenhum DELETE remoto é executado.

## Acessibilidade

- CTAs com área de toque mínima existente do design system.
- labels de acessibilidade nos valores e ações críticas.
- suporte a font scaling do React Native.
- foco visível em botões no web.
- verde não é usado como única forma de comunicar um valor/estado.

## Design

Durante o modo fechado:

- fundo branco no light;
- fundo quase preto no dark;
- verde usado como acento;
- sem grandes blocos verdes no caminho crítico.

## Testes automatizados adicionados

`features/closed-test/config.test.ts`

Valida:

- as cinco contas aprovadas;
- o mapeamento para categorias existentes;
- as perguntas exatas aprovadas pelo QA.

Os fluxos de toque/tempo de entendimento permanecem como testes manuais de usabilidade, pois a suíte atual usa Jest/Node e não inclui uma biblioteca de renderização de React Native.

## Reteste manual obrigatório

### Cenário 1

- renda: R$ 4.000
- Luz: R$ 173

Home esperada:

- Recebi: R$ 4.000,00
- Gastei: R$ 173,00
- Ainda tenho: R$ 3.827,00
- “A luz já está no seu mês.”

### Cenário 2

- “Prefiro informar depois”
- registrar Luz: R$ 173

Home esperada:

- Renda: Ainda não informada
- Gastei: R$ 173,00
- botão Informar renda
- nenhum “Ainda tenho” numérico

### Cenário 3

- escolha da conta
- “Agora não”

Esperado:

- nenhuma transação criada;
- nenhuma conta gravada como R$ 0,00.

## Fora do escopo

- redesign das demais telas;
- OCR/NFC-e;
- metas;
- recorrências;
- planejamento;
- novas decisões de produto;
- merge em `main`.

A branch deve ser validada pelo QA no celular e no computador antes de merge.
