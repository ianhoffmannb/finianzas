import { useMemo } from 'react';
import { useCollection } from './useCollection';
import { FIRST_MONTH } from '../utils/date';
import type { MonthClose } from '../types/models';

export interface PeriodTotals {
  income: number;
  fixed: number;
  variable: number;
  savings: number;
  capex: number;
  fcl: number;
}

const EMPTY: PeriodTotals = { income: 0, fixed: 0, variable: 0, savings: 0, capex: 0, fcl: 0 };

export function totalsOf(close: MonthClose): PeriodTotals {
  const income = close.income_total ?? 0;
  const fixed = close.fixed_total ?? 0;
  const variable = close.variable_actual ?? 0;
  const savings = close.savings_actual ?? 0;
  const capex = close.capex_actual ?? 0;
  return { income, fixed, variable, savings, capex, fcl: income - fixed - variable - savings - capex };
}

export function sumTotals(list: PeriodTotals[]): PeriodTotals {
  return list.reduce(
    (acc, t) => ({
      income: acc.income + t.income,
      fixed: acc.fixed + t.fixed,
      variable: acc.variable + t.variable,
      savings: acc.savings + t.savings,
      capex: acc.capex + t.capex,
      fcl: acc.fcl + t.fcl,
    }),
    EMPTY
  );
}

/** Todos los cierres del usuario: alimenta la vista anual y el ahorro acumulado. */
export function useMonthCloses() {
  const col = useCollection<MonthClose>('month_closes', [], { column: 'month' });

  // Septiembre 2026 es el inicio de la historia: lo anterior no cuenta.
  const closed = useMemo(
    () => col.rows.filter((r) => r.status === 'closed' && r.month >= FIRST_MONTH),
    [col.rows]
  );

  /** Lo que llevas guardado desde que empezaste, mes a mes cerrado. */
  const accumulatedSavings = useMemo(() => closed.reduce((a, r) => a + (r.savings_actual ?? 0), 0), [closed]);

  const byMonth = useMemo(() => {
    const map = new Map<string, MonthClose>();
    for (const r of closed) map.set(r.month, r);
    return map;
  }, [closed]);

  function forYear(year: number) {
    return closed.filter((r) => Number(r.month.slice(0, 4)) === year);
  }

  return { ...col, closed, byMonth, accumulatedSavings, forYear };
}
