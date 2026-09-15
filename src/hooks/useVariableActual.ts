import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { VariableActual } from '../types/models';

/** Gasto variable real del mes, desglosado por subcategoría. */
export function useVariableActual(month: string) {
  const col = useCollection<VariableActual>('variable_actuals', [{ column: 'month', value: month }]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of col.rows) map.set(row.category, (map.get(row.category) ?? 0) + row.amount);
    return map;
  }, [col.rows]);

  const amount = useMemo(() => col.rows.reduce((a, r) => a + r.amount, 0), [col.rows]);

  function amountOf(category: string) {
    return byCategory.get(category) ?? 0;
  }

  async function setAmount(category: string, value: number) {
    const existing = col.rows.find((r) => r.category === category);
    if (existing) return col.update(existing.id, { amount: value } as never);
    return col.insert({ month, category, amount: value } as never);
  }

  return { ...col, byCategory, amount, amountOf, setAmount };
}
