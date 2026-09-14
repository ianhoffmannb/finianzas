import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { Account } from '../types/models';
import { balanceInClp, sumAccountsClp } from '../utils/accounts';

export function useAccounts() {
  const col = useCollection<Account>('accounts', [], { column: 'sort_order' });

  const liquido = useMemo(() => col.rows.filter((a) => a.type === 'liquido'), [col.rows]);
  const invertido = useMemo(() => col.rows.filter((a) => a.type === 'invertido'), [col.rows]);
  const deuda = useMemo(() => col.rows.filter((a) => a.type === 'deuda'), [col.rows]);

  const totalLiquido = useMemo(() => sumAccountsClp(liquido), [liquido]);
  const totalInvertido = useMemo(() => sumAccountsClp(invertido), [invertido]);
  const totalDeuda = useMemo(() => -sumAccountsClp(deuda), [deuda]); // positive magnitude
  const netWorth = totalLiquido + totalInvertido - totalDeuda;

  return { ...col, liquido, invertido, deuda, totalLiquido, totalInvertido, totalDeuda, netWorth, balanceInClp };
}
