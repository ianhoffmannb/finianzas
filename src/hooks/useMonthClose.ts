import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { MonthClose } from '../types/models';

export function useMonthClose(month: string) {
  const { user } = useAuth();
  const [data, setData] = useState<MonthClose | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: row } = await supabase
      .from('month_closes')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();
    setData(row as MonthClose | null);
    setLoading(false);
  }, [user?.id, month]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function save(patch: Partial<MonthClose>) {
    if (!user) return null;
    const { data: row } = await supabase
      .from('month_closes')
      .upsert({ month, status: 'open', step_data: {}, ...data, ...patch, user_id: user.id } as never, { onConflict: 'user_id,month' })
      .select()
      .single();
    const result = row as MonthClose | null;
    if (result) setData(result);
    return result;
  }

  async function finalize(patch: Partial<MonthClose>) {
    return save({ ...patch, status: 'closed', closed_at: new Date().toISOString() });
  }

  return { close: data, loading, save, finalize, isClosed: data?.status === 'closed' };
}
