import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { IncomeItem } from '../types/models';

export function useIncomeItems() {
  const col = useCollection<IncomeItem>('income_items', [{ column: 'active', value: true }], {
    column: 'sort_order',
  });
  const total = useMemo(() => col.rows.reduce((a, r) => a + r.amount, 0), [col.rows]);
  const fijo = useMemo(() => col.rows.filter((r) => r.certainty === 'fijo'), [col.rows]);
  const variable = useMemo(() => col.rows.filter((r) => r.certainty === 'variable'), [col.rows]);
  return { ...col, total, fijo, variable };
}
