import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { Goal, GoalHorizon } from '../types/models';

const HORIZON_ORDER: GoalHorizon[] = ['1y', '3y', '5y', '10y', 'recurrente'];

export function useGoals() {
  const col = useCollection<Goal>('goals', [{ column: 'active', value: true }], { column: 'sort_order' });

  const byHorizon = useMemo(() => {
    const map = new Map<GoalHorizon, Goal[]>();
    for (const h of HORIZON_ORDER) map.set(h, []);
    for (const g of col.rows) map.get(g.horizon)?.push(g);
    return map;
  }, [col.rows]);

  const monthlyRequired = useMemo(() => col.rows.reduce((a, g) => a + requiredMonthly(g), 0), [col.rows]);

  return { ...col, byHorizon, monthlyRequired, horizons: HORIZON_ORDER };
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
