/** Data local YYYY-MM-DD. */
export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(date: Date = new Date()): string {
  return monthKeyFromDate(toISODate(date));
}

export function isSameMonth(isoDate: string, monthKey: string): boolean {
  return monthKeyFromDate(isoDate) === monthKey;
}

export type DayGreeting = 'Bom dia' | 'Boa tarde' | 'Boa noite';

export function greetingForHour(hour: number = new Date().getHours()): DayGreeting {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Formata YYYY-MM-DD → dd/MM/yyyy */
export function formatISODateBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}
