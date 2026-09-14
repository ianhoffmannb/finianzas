// CLP con punto de miles y sin decimales. Estados financieros: sin signo $, negativos en paréntesis.
// Dólares: siempre US$ + equivalente en CLP al lado.

const clpFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

export function formatCLP(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${clpFormatter.format(Math.abs(Math.round(value)))}`;
}

/** Statement style: no $ sign, negatives in parentheses. */
export function formatStatement(value: number): string {
  const abs = clpFormatter.format(Math.abs(Math.round(value)));
  return value < 0 ? `(${abs})` : abs;
}

export function formatUSD(value: number): string {
  return `US$${clpFormatter.format(Math.round(value))}`;
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

export function formatSignedCLP(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}$${clpFormatter.format(Math.abs(Math.round(value)))}`;
}

/** Parse a CLP-formatted string like "90.000" back into a number. */
export function parseCLP(input: string): number {
  const cleaned = input.replace(/[^\d-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
