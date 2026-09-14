import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Filter {
  column: string;
  value: string | number | boolean;
}

/**
 * Generic CRUD over one table, scoped to the signed-in user (RLS also
 * enforces this server-side). `filters` narrows further, e.g. by month.
 */
export function useCollection<T extends { id: string }>(
  table: string,
  filters: Filter[] = [],
  orderBy?: { column: string; ascending?: boolean }
) {
  const { user } = useAuth();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filters);

  // A filter whose value is still empty means the caller is waiting on
  // something (a row id that hasn't loaded yet). Querying anyway sends
  // `col=eq.` and Postgres rejects it as an invalid uuid.
  const pending = filters.some((f) => f.value === '' || f.value === undefined || f.value === null);

  const refetch = useCallback(async () => {
    if (!user || pending) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase.from(table).select('*').eq('user_id', user.id);
    for (const f of filters) query = query.eq(f.column, f.value);
    if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    const { data, error: err } = await query.returns<T[]>();
    if (err) setError(err.message);
    else {
      setRows(data ?? []);
      setError(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, user?.id, filterKey, pending, orderBy?.column, orderBy?.ascending]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function insert(row: Partial<T>) {
    if (!user) return { error: 'no-session', data: null };
    const { data, error: err } = await supabase
      .from(table)
      .insert({ ...row, user_id: user.id } as never)
      .select()
      .single();
    if (!err) await refetch();
    return { data: data as T | null, error: err?.message ?? null };
  }

  async function update(id: string, patch: Partial<T>) {
    const { data, error: err } = await supabase.from(table).update(patch as never).eq('id', id).select().single();
    if (!err) await refetch();
    return { data: data as T | null, error: err?.message ?? null };
  }

  async function upsert(row: Partial<T>, onConflict: string) {
    if (!user) return { error: 'no-session', data: null };
    const { data, error: err } = await supabase
      .from(table)
      .upsert({ ...row, user_id: user.id } as never, { onConflict })
      .select()
      .single();
    if (!err) await refetch();
    return { data: data as T | null, error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (!err) await refetch();
    return { error: err?.message ?? null };
  }

  return { rows, loading, error, refetch, insert, update, upsert, remove };
}
