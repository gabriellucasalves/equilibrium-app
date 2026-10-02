/** Normaliza descrições de cupom sem apagar o raw. */
export function normalizeItemDescription(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return '';

  text = text
    .replace(/\bT\d+\b/gi, '')
    .replace(/\bCDB\b/gi, '')
    .replace(/\bUN\b/gi, '')
    .replace(/\bKG\b/gi, 'kg')
    .replace(/\bLT\b/gi, 'L')
    .replace(/\bML\b/gi, 'ml')
    .replace(/\s+/g, ' ')
    .trim();

  // Title-ish case for readability
  const lower = text.toLowerCase();
  return lower.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

export function preferenceKey(normalizedDescription: string): string {
  return normalizedDescription
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sumItemsCents(
  items: readonly { totalPriceInCents: number }[],
): number {
  return items.reduce((acc, item) => {
    if (!Number.isInteger(item.totalPriceInCents)) {
      throw new Error(`totalPriceInCents inválido: ${item.totalPriceInCents}`);
    }
    return acc + item.totalPriceInCents;
  }, 0);
}

export function totalDifferenceCents(
  itemsSum: number,
  receiptTotal: number,
): number {
  return receiptTotal - itemsSum;
}
