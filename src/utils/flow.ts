import type { DonutSlice } from '../components/charts/DonutChart';

export interface MonthFlow {
  income: number;
  fixed: number;
  variable: number;
  savings: number;
  capex: number;
}

export function freeCash(f: MonthFlow): number {
  return f.income - f.fixed - f.variable - f.savings - f.capex;
}

/**
 * En qué se reparte el ingreso del mes. "Libre" es lo que sobra, así que solo
 * aparece cuando es positivo; si te pasaste, el total gastado excede el ingreso
 * y el anillo lo muestra sin inventar un resto.
 */
export function flowSlices(f: MonthFlow): DonutSlice[] {
  const libre = freeCash(f);
  const slices: DonutSlice[] = [
    { key: 'fijos', label: 'Gastos fijos', value: f.fixed, color: 'var(--chart-fijos)' },
    { key: 'variables', label: 'Gastos variables', value: f.variable, color: 'hatch' },
    { key: 'ahorro', label: 'Ahorro', value: f.savings, color: 'var(--chart-ahorro)' },
    { key: 'capex', label: 'Capex personal', value: f.capex, color: 'var(--chart-capex)' },
  ];
  if (libre > 0) {
    slices.push({ key: 'libre', label: 'Libre', value: libre, color: 'var(--chart-libre)', note: 'sin asignar' });
  }
  return slices;
}
