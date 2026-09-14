import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { SavingsCommitment } from '../types/models';

export function useSavingsCommitments() {
  const col = useCollection<SavingsCommitment>('savings_commitments', [{ column: 'active', value: true }]);
  const total = useMemo(() => col.rows.reduce((a, r) => a + r.amount, 0), [col.rows]);
  return { ...col, total };
}
