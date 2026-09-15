import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { Goal, GoalHorizon } from '../types/models';

const HORIZON_ORDER: GoalHorizon[] = ['1y', '3y', '5y', '10y', 'recurrente'];

export function useGoals() {
  const col = useCollection<Goal>('goals', [{ column: 'active', value: true }], { column: 'sort_order' });

  const open = useMemo(() => col.rows.filter((g) => !g.completed_at), [col.rows]);
  const completed = useMemo(() => col.rows.filter((g) => g.completed_at), [col.rows]);

  const byHorizon = useMemo(() => {
    const map = new Map<GoalHorizon, Goal[]>();
    for (const h of HORIZON_ORDER) map.set(h, []);
    for (const g of open) map.get(g.horizon)?.push(g);
    return map;
  }, [open]);

  // Solo lo que sigue en pie pide plata cada mes; lo cumplido ya no compromete.
  const monthlyRequired = useMemo(() => open.reduce((a, g) => a + requiredMonthly(g), 0), [open]);

  /** Marca la meta como cumplida y deja el avance calzado con el objetivo. */
  async function complete(goal: Goal) {
    return col.update(goal.id, {
      completed_at: new Date().toISOString(),
      current_amount: Math.max(goal.current_amount, goal.target_amount),
    } as never);
  }

  async function reopen(goal: Goal) {
    return col.update(goal.id, { completed_at: null } as never);
  }

  return { ...col, open, completed, byHorizon, monthlyRequired, horizons: HORIZON_ORDER, complete, reopen };
}

/** Aporte mensual requerido para llegar a la meta en la fecha objetivo. */
export function requiredMonthly(goal: Goal): number {
  if (!goal.target_date) return 0;
  const months = monthsRemaining(goal.target_date);
  if (months <= 0) return Math.max(goal.target_amount - goal.current_amount, 0);
  return Math.max((goal.target_amount - goal.current_amount) / months, 0);
}

export function monthsRemaining(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

export function progressPct(goal: Goal): number {
  if (goal.target_amount <= 0) return 0;
  return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
}
