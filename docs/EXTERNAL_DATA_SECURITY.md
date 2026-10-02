# Segurança de dados externos

## Isolamento

Conteúdo da internet entra como `<EXTERNAL_DATA>…</EXTERNAL_DATA>` após sanitização.

Nunca é injetado como mensagem de sistema.

## Prompt injection

Títulos/descrições com “ignore instructions…” são neutralizados (`sanitizeExternalText`).

Teste: provider devolve título malicioso → tratado só como texto; sem expor dados financeiros.

## Links

- Preferir `https`
- Bloquear `javascript:`, `data:`, etc.
- Abrir fontes via `expo-web-browser` (navegador do sistema)

## Offline

Dados financeiros continuam. Busca externa: “Essa consulta precisa de internet.” (ou cache fresco).
