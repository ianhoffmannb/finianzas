/** Septiembre 2026 es el primer mes de la historia: antes de eso no hay app. */
export const FIRST_MONTH = '2026-09-01';

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** "2026-09-01" -> "sep 2026" */
export function formatMonthYear(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "2026-09-11" -> "11 sep" */
export function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export function shortMonthLabel(monthKey: string): string {
  const [, m] = monthKey.split('-').map(Number);
  return MONTHS_SHORT[m - 1];
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function isBeforeFirstMonth(monthKey: string): boolean {
  return monthKey < FIRST_MONTH;
}

/** Meses desde el primero hasta el indicado, inclusive. */
export function monthsFromStart(until: string): string[] {
  const out: string[] = [];
  let cursor = FIRST_MONTH;
  while (cursor <= until) {
    out.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return out;
}
