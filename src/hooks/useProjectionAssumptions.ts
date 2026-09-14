import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectionAssumptions } from '../types/models';

const DEFAULTS: Omit<ProjectionAssumptions, 'id' | 'user_id' | 'updated_at'> = {
  graduation_date: null,
  milestone_date: null,
  monthly_income_post_grad: 1_300_000,
  savings_rate: 0.3,
  expected_return: 0.06,
  expense_inflation: 0.04,
  conservative_factor: 0.7,
  optimistic_factor: 1.4,
};

export function useProjectionAssumptions() {
  const { user } = useAuth();
  const [data, setData] = useState<ProjectionAssumptions | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: row } = await supabase
      .from('projection_assumptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setData(row as ProjectionAssumptions | null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function save(patch: Partial<ProjectionAssumptions>) {
    if (!user) return;
    const { data: row } = await supabase
      .from('projection_assumptions')
      .upsert({ ...DEFAULTS, ...data, ...patch, user_id: user.id } as never, { onConflict: 'user_id' })
      .select()
      .single();
    if (row) setData(row as ProjectionAssumptions);
  }

  return {
    assumptions: data ?? { ...DEFAULTS, id: '', user_id: user?.id ?? '', updated_at: '' },
    // Sin fila guardada, lo que se muestra son valores por defecto de la app,
    // no supuestos del usuario: la vista lo dice en vez de disfrazarlos.
    configured: data !== null,
    loading,
    save,
  };
}
