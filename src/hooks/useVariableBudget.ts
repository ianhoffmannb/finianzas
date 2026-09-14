import { useCollection } from './useCollection';
import type { VariableBudget } from '../types/models';

export function useVariableBudget() {
  const col = useCollection<VariableBudget>('variable_budgets', [{ column: 'active', value: true }]);
  return { ...col, budget: col.rows[0] ?? null };
}
