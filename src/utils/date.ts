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
