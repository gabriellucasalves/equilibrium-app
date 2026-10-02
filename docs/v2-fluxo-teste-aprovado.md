# Fluxo de teste fechado v2 — especificação UX aprovada

Este arquivo é a especificação de UX aprovada por UX e QA. Não implementa o fluxo. Não altera código da aplicação, telas, stores nem configuração.

## Modo de teste fechado

Com `EXPO_PUBLIC_CLOSED_TEST_MODE=true`, o app abre no onboarding, não no login.

- Autenticação e Supabase permanecem.
- Não há senha fixa.
- A navegação inferior aparece somente depois da Home.

Quando a flag está ligada, o app inicia com estado financeiro local limpo:

- sem renda;
- sem transações;
- sem orçamentos locais;
- sem flags de demo;
- sem dados residuais de teste.

O app não deve carregar automaticamente `constants/demo.ts`, não deve fazer seed DEMO e não deve chamar `loadDemoData`.

Essa limpeza **não** roda quando a flag está desligada.

O app **não** deve apagar o banco remoto.

## Primeira abertura

Na primeira abertura:

- renda não informada;
- total gasto é R$ 0,00 apenas como soma vazia;
- nenhuma conta preenchida;
- nenhuma transação;
- nenhum orçamento fictício;
- nenhum nome de pessoa;
- nenhum dado demo.

Sem renda, a Home mostra:

- **Renda** / **Ainda não informada**
- botão **Informar renda**
- **Ainda tenho** sem número
- **Seu mês** com **Adicionar**, não R$ 0,00 em cada conta

## Tela 1 — `app/(onboarding)/welcome.tsx`

- A palavra **Equilibrium**
- Título: **Vamos organizar seu dinheiro?**
- Único botão: **Começar**
- Sem bloco verde grande

Tema claro:

- fundo branco
- texto preto
- verde somente no botão

Tema escuro:

- fundo quase preto
- texto branco
- verde somente no botão

**Começar** vai para a tela de renda.

## Tela 2 — `app/(onboarding)/income.tsx`

- Título: **Quanto você recebe por mês?**
- Campo de dinheiro grande
- Exemplo: R$ 4.000,00
- Teclado numérico
- Máscara PT-BR
- Centavos internamente
- Sem valor negativo
- Não salvar zero

**Continuar** salva uma renda válida e vai para a escolha de conta.

**Prefiro informar depois** **não** vai para a Home. Vai para **Qual conta você quer registrar?** e a renda permanece não informada.

## Tela 3 — tela nova (escolha de conta)

`app/(onboarding)/expenses.tsx`, `app/(onboarding)/focus.tsx` e `app/(onboarding)/summary.tsx` permanecem no projeto, mas ficam fora deste caminho.

- Título: **Qual conta você quer registrar?**
- **Luz** é o botão grande
- Menores, mas tocáveis: **Água**, **Mercado**, **Aluguel**, **Combustível**
- Não mostrar **Outra conta**

**Agora não** não cria transação, não salva zero e vai para a Home.

## Tela 4 — uma tela reutilizável (valor da conta)

Perguntas exatas:

| Conta        | Pergunta                                 |
| ------------ | ---------------------------------------- |
| Luz          | Quanto veio sua conta de luz?            |
| Água         | Quanto veio sua conta de água?           |
| Mercado      | Quanto você gastou no mercado?           |
| Aluguel      | Quanto veio o aluguel?                   |
| Combustível  | Quanto você gastou com combustível?      |

- Campo de dinheiro grande
- Teclado numérico
- Centavos internamente
- **Salvar** começa desabilitado e habilita somente com valor > 0
- Vazio, zero e negativo não salvam

**Agora não** não salva nada e vai para a Home.

**Salvar** cria uma despesa real com data de hoje e abre a Home.

Não perguntar categoria nem descrição de novo.

Rótulos da tela permanecem: **Luz**, **Água**, **Mercado**, **Aluguel**, **Combustível**.

Categorias persistidas usam o modelo existente:

| Rótulo da tela | Categoria persistida |
| -------------- | -------------------- |
| Luz            | Energia              |
| Água           | Água                 |
| Mercado        | Mercado              |
| Aluguel        | Moradia              |
| Combustível    | Transporte           |

A pessoa nunca vê **Energia**, **Moradia** ou **Transporte** neste fluxo.

## Home desta build

A Home desta build mostra **somente**:

- **Olá.** (nunca Bom dia, Boa tarde, Boa noite, e sem nome)
- três blocos verticais
- uma frase do Controlinho
- **Seu mês**

Não entram nesta tela:

- projeção
- orçamentos
- contas a vencer
- gráficos
- metas
- recorrentes
- evolução
- o `AvailableCard` verde atual
- três cards lado a lado
- uma linha única juntando recebido e gasto

Com renda, os três blocos são **Recebi**, **Gastei** e **Ainda tenho**, cada um no seu bloco. **Ainda tenho** é visualmente mais forte, mas os outros dois continuam legíveis.

Exemplo depois de renda R$ 4.000 e luz R$ 173:

- Recebi R$ 4.000,00
- Gastei R$ 173,00
- Ainda tenho R$ 3.827,00
- nada mais derivado de outros dados

Controlinho: uma frase curta, sem valor repetido, sem chat, sem card pesado, sem bloco verde.

Depois da luz: **A luz já está no seu mês.**

**Seu mês** lista as cinco categorias, com valor ou **Adicionar**. **Adicionar** abre direto a pergunta daquela categoria.

**Informar renda** reabre a renda e volta para a Home, sem reiniciar o onboarding.

## Design

- Verde é acento, não fundo.
- Claro: fundo branco, texto quase preto, cinza secundário.
- Escuro: fundo quase preto, texto branco, cinza secundário.
- Sem áreas verde-musgo.
- Sem card dentro de card.
- Sem sombras fortes.
- Sem muitas bordas ou pills.

Acessibilidade:

- escala de fonte
- texto sem corte
- sem altura fixa em texto
- alvos de toque confortáveis
- sem ações só com ícone
- alto contraste
- informação não só por cor
- foco visível na web
- rótulos acessíveis
- VoiceOver / TalkBack

Mobile first. Desktop é uma coluna estreita centralizada, não um dashboard horizontal.

## Cálculos

Usar os helpers existentes. Não duplicar lógica financeira. Reutilizar `FinanceStore` e os repositórios existentes.

- **Recebi**: renda mensal informada.
- **Gastei**: soma das despesas reais deste mês.
- **Ainda tenho**: Recebi menos Gastei, somente quando a renda existe.
- Centavos internamente.

## Aceite

Sem explicação, a pessoa toca **Começar**, informa a renda, toca **Luz**, digita 173, vê R$ 173,00, toca **Salvar** e, na Home, lê as três linhas em 5 segundos.

**Prefiro informar depois** ainda mostra **Luz**.

**Agora não** não salva zero.

O mês começa vazio.

Depois de R$ 4.000 e da conta de luz de R$ 173, a Home mostra somente o que vem dessas duas entradas.
