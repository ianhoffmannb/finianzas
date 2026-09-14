import { useCollection } from './useCollection';
import type { VariableBudget } from '../types/models';

const DEFAULT_LABEL = 'Café, salidas, Uber, panoramas';

export function useVariableBudget() {
  const col = useCollection<VariableBudget>('variable_budgets', [{ column: 'active', value: true }]);
  const budget = col.rows[0] ?? null;

  async function setCap(monthly_cap: number, label?: string) {
    if (budget) return col.update(budget.id, { monthly_cap, label: label ?? budget.label } as never);
    return col.insert({ monthly_cap, label: label ?? DEFAULT_LABEL, active: true } as never);
  }

  return { ...col, budget, cap: budget?.monthly_cap ?? 0, label: budget?.label ?? DEFAULT_LABEL, setCap };
}
