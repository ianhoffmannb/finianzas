import { useCollection } from './useCollection';
import type { GoalContribution } from '../types/models';

export function useGoalContributions(goalId: string) {
  const col = useCollection<GoalContribution>('goal_contributions', [{ column: 'goal_id', value: goalId }], {
    column: 'month',
  });
  return col;
}
