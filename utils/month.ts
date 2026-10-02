import { currentMonthKey } from '@/utils/date';

/** Desloca um monthKey YYYY-MM por `delta` meses. */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yRaw, mRaw] = monthKey.split('-');
  const y = Number(yRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return currentMonthKey();
  }
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

export function monthLabelBR(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  const names = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const idx = Number(m) - 1;
  return `${names[idx] ?? m}/${y}`;
}
