import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Sin credenciales la app no puede hacer nada: se avisa en pantalla, no con un crash. */
export const supabaseConfigured = Boolean(url && anonKey);

// Row shapes live in src/types/models.ts and are applied per-query with
// `.returns<T>()` rather than as a single generated Database type, so the
// schema in supabase/schema.sql stays the one source of truth to keep in sync.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-key');
