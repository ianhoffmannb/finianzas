import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y completa tus credenciales de Supabase.'
  );
}

// Row shapes live in src/types/models.ts and are applied per-query with
// `.returns<T>()` rather than as a single generated Database type, so the
// schema in supabase/schema.sql stays the one source of truth to keep in sync.
export const supabase = createClient(url ?? '', anonKey ?? '');
