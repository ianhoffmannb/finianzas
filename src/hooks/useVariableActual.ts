import { useCollection } from './useCollection';
import type { VariableActual } from '../types/models';

export function useVariableActual(month: string) {
  const col = useCollection<VariableActual>('variable_actuals', [{ column: 'month', value: month }]);
  const record = col.rows[0] ?? null;

  async function setAmount(amount: number) {
    return col.upsert({ ...(record ?? {}), month, amount }, 'user_id,month');
  }

  return { ...col, record, amount: record?.amount ?? 0, setAmount };
}
