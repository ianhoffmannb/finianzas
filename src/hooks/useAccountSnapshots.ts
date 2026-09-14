import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { AccountBalanceSnapshot } from '../types/models';

/** Net worth per month, summed across accounts (debt already negative), last N months. */
export function useNetWorthHistory(months = 6) {
  const { user } = useAuth();
  const [history, setHistory] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('account_balance_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: true })
      .returns<AccountBalanceSnapshot[]>();

    const byMonth = new Map<string, number>();
    for (const row of data ?? []) {
      byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.balance_clp);
    }
    const sorted = [...byMonth.entries()].map(([month, total]) => ({ month, total }));
    setHistory(sorted.slice(-months));
    setLoading(false);
  }, [user?.id, months]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { history, loading, refetch };
}
