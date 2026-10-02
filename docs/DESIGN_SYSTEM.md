# Design System — Equilibrium

## Personalidade visual

Calma, espaço em branco, tipografia expressiva, contraste suave. Premium sem parecer banco ou ERP.

## Tipografia

| Papel | Família |
|-------|---------|
| Display / títulos | Fraunces |
| Corpo / UI | DM Sans |

Escalas em `constants/tokens.ts` → `typography.sizes`.

## Cor

Paleta sage/ink (sem purple default, sem cream+terracotta clichê).

- Light: fundo `#FAFBF9`, accent sage `#2F6150`
- Dark: fundo `#0E1311`, accent sage claro `#6BA890`

Tokens semânticos: `background`, `surface`, `text`, `accent`, `border`, `danger`, etc. **Proibido hex solto nos componentes.**

## Componentes (Fase 1)

- `Screen` — safe area + scroll + keyboard
- `Text` — variantes hero/title/subtitle/body/caption/label
- `Button` — primary / secondary / ghost
- `Input` — label, hint, erro
- `ProgressBar` — onboarding
- `Spacer`

## Tema

`light` | `dark` | `system` via store + `useColorScheme`.

## Motion

Entrada suave no welcome (fade + rise). Press scale nos botões. Evitar ruído.

## Controlinho

Estados: `idle` | `thinking` | `happy` | `alert` | `speaking`. Mascote minimalista “C” — não copiar Dots/Grok.
