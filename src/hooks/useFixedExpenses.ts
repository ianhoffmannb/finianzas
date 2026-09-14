import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { FixedExpense } from '../types/models';

export function useFixedExpenses() {
  const col = useCollection<FixedExpense>('fixed_expenses', [{ column: 'active', value: true }], {
    column: 'due_day',
  });
  const total = useMemo(() => col.rows.reduce((a, r) => a + r.amount, 0), [col.rows]);
  return { ...col, total };
}
