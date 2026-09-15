import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { PlannedFlow } from '../types/models';

/** Gastos e ingresos programados a futuro (proyección de caja). */
export function usePlannedFlows() {
  const col = useCollection<PlannedFlow>('planned_flows', [], { column: 'month' });

  const pending = useMemo(() => col.rows.filter((r) => r.status === 'pendiente'), [col.rows]);

  /** Neto programado de un mes: ingresos menos gastos, solo lo pendiente. */
  function netFor(month: string) {
    return pending
      .filter((r) => r.month === month)
      .reduce((acc, r) => acc + (r.kind === 'ingreso' ? r.amount : -r.amount), 0);
  }

  function forMonth(month: string) {
    return col.rows.filter((r) => r.month === month);
  }

  return { ...col, pending, netFor, forMonth };
}
