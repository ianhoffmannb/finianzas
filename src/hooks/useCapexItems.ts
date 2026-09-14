import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { CapexItem } from '../types/models';

export function useCapexItems(month: string) {
  const col = useCollection<CapexItem>('capex_items', [{ column: 'month', value: month }]);
  const total = useMemo(() => col.rows.reduce((a, r) => a + r.amount, 0), [col.rows]);
  return { ...col, total };
}
