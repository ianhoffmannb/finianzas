import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { VariableBudget } from '../types/models';
import { VARIABLE_CATEGORIES, variableCategoryLabel } from '../utils/categories';

/** Tope mensual por subcategoría de gasto variable. */
export function useVariableBudget() {
  const col = useCollection<VariableBudget>('variable_budgets', [{ column: 'active', value: true }]);

  const byCategory = useMemo(() => {
    const map = new Map<string, VariableBudget>();
    for (const row of col.rows) map.set(row.category, row);
    return map;
  }, [col.rows]);

  const cap = useMemo(() => col.rows.reduce((a, r) => a + r.monthly_cap, 0), [col.rows]);

  function capOf(category: string) {
    return byCategory.get(category)?.monthly_cap ?? 0;
  }

  async function setCap(category: string, monthly_cap: number) {
    const existing = byCategory.get(category);
    if (existing) return col.update(existing.id, { monthly_cap } as never);
    return col.insert({
      category,
      monthly_cap,
      label: variableCategoryLabel(category),
      active: true,
    } as never);
  }

  return { ...col, byCategory, cap, capOf, setCap, categories: VARIABLE_CATEGORIES };
}
