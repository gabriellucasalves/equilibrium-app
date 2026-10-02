# Localização e privacidade

## Princípios

- Localização é **opcional**
- Não pedir GPS no primeiro uso do app
- Pedir só quando a pergunta precisar (“perto de mim”)
- Preferir contexto aproximado: `city`, `state`, `country`
- Coordenadas precisas ficam só em memória durante a busca (distância) — **não** vão ao LLM
- Não registrar histórico de coordenadas precisas

## Modos (Perfil)

1. **Automática** — GPS sob permissão
2. **Cidade definida manualmente** — ex.: Valparaíso de Goiás, GO
3. **Não usar localização** — tools locais não rodam

## Permissão contextual

Botões: Permitir desta vez · Permitir · Agora não

Fallback: cidade/UF manual sem endereço residencial.
