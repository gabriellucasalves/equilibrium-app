/** Validação de URLs e isolamento de conteúdo externo (anti prompt-injection). */

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;

export function isSafeHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (BLOCKED_SCHEMES.test(parsed.protocol)) return false;
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function preferHttpsUrl(url: string): string | null {
  if (!isSafeHttpsUrl(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Remove padrões óbvios de injection e limita tamanho. */
export function sanitizeExternalText(input: string, maxLen = 400): string {
  let text = String(input ?? '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  text = text.replace(
    /ignore\s+(todas\s+as\s+)?instru[cç][oõ]es|ignore\s+all\s+instructions|system\s*prompt|envie\s+os\s+dados|reveal\s+(your|the)\s+(prompt|system)/gi,
    '[conteúdo externo]',
  );

  if (text.length > maxLen) text = `${text.slice(0, maxLen)}…`;
  return text;
}

/**
 * Empacota dados externos como bloco isolado — nunca como mensagem de sistema.
 */
export function wrapAsExternalData(fields: Record<string, string | number | null | undefined>): string {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${sanitizeExternalText(String(v), 200)}`);
  return `<EXTERNAL_DATA>\n${lines.join('\n')}\n</EXTERNAL_DATA>`;
}
