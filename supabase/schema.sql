-- FinIANzas — schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`) on your project.
-- Every table is scoped to auth.uid() via RLS, so this is safe for a single user today
-- and ready for more users later without any app-code changes.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Cuentas (líquido / invertido / deuda)
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('liquido', 'invertido', 'deuda')),
  currency text not null default 'CLP' check (currency in ('CLP', 'USD')),
  current_balance numeric not null default 0, -- en la moneda de la cuenta
  fx_rate numeric, -- dólar observado usado para convertir a CLP (solo cuentas USD)
  credit_limit numeric,
  due_day int check (due_day between 1 and 31),
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Saldo histórico por cuenta, tomado en cada cierre de mes (alimenta balance
-- general y "evolución del patrimonio").
create table if not exists account_balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, -- siempre día 1
  balance numeric not null, -- en la moneda de la cuenta
  balance_clp numeric not null, -- convertido a CLP con el dólar del cierre
  created_at timestamptz not null default now(),
  unique (account_id, month)
);

-- ---------------------------------------------------------------------------
-- Mes: ingresos, gastos fijos, tope de variables, ahorro comprometido
-- ---------------------------------------------------------------------------
create table if not exists income_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  certainty text not null default 'fijo' check (certainty in ('fijo', 'variable')),
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0, -- monto mensual (ya prorrateado si es anual)
  due_day int not null check (due_day between 1 and 31),
  is_annual boolean not null default false,
  annual_amount numeric,
  category text,
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists variable_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Café, salidas, Uber, panoramas',
  monthly_cap numeric not null default 0,
  active boolean not null default true
);

create table if not exists savings_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  label text not null,
  amount numeric not null default 0,
  active boolean not null default true
);

-- Capex es puntual: se registra mes a mes, no es una plantilla recurrente.
create table if not exists capex_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  label text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Variable real gastado ese mes (un solo número, sin desglose — por diseño).
create table if not exists variable_actuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  amount numeric not null default 0,
  unique (user_id, month)
);

-- ---------------------------------------------------------------------------
-- Cierre de mes (wizard de 4 pasos)
-- ---------------------------------------------------------------------------
create table if not exists month_closes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  usd_clp_rate numeric, -- dólar observado usado en el cierre
  income_total numeric,
  fixed_total numeric,
  variable_actual numeric,
  savings_actual numeric,
  capex_actual numeric,
  net_worth_result numeric,
  step_data jsonb not null default '{}'::jsonb, -- respuestas del wizard, para poder resumir
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- Recordatorio recurrente del día 7 (o el que configure el usuario)
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_month int not null default 7,
  title text not null default 'Llega la mesada',
  body text not null,
  active boolean not null default true
);

create table if not exists reminder_completions (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references reminders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  done boolean not null default false,
  unique (reminder_id, month)
);

-- ---------------------------------------------------------------------------
-- Metas (1/3/5/10 años + recurrentes)
-- ---------------------------------------------------------------------------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  target_date date,
  horizon text not null check (horizon in ('1y', '3y', '5y', '10y', 'recurrente')),
  category text not null default 'financiera' check (category in ('financiera', 'de_vida')),
  assumes_future_salary boolean not null default false,
  monthly_contribution numeric not null default 0, -- aporte actual comprometido
  recurs_yearly boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  amount numeric not null default 0,
  unique (goal_id, month)
);

-- ---------------------------------------------------------------------------
-- Proyecciones — supuestos del escenario base (conservador/optimista se
-- derivan con un factor sobre el ingreso post-título, igual que en el mockup).
-- ---------------------------------------------------------------------------
create table if not exists projection_assumptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  graduation_date date,
  milestone_date date, -- ej. examen de grado; la línea vertical del gráfico
  monthly_income_post_grad numeric not null default 0,
  savings_rate numeric not null default 0.3, -- 0..1
  expected_return numeric not null default 0.06, -- anual, real
  expense_inflation numeric not null default 0.04, -- anual
  conservative_factor numeric not null default 0.7,
  optimistic_factor numeric not null default 1.4,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Hogar — "esta plata no es mía": completamente separado del resto.
-- ---------------------------------------------------------------------------
create table if not exists household_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  amount numeric not null default 0,
  received_on date,
  unique (user_id, month)
);

create table if not exists household_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  spent_on date not null,
  label text not null,
  amount numeric not null default 0,
  category text not null default 'supermercado_feria' check (category in ('supermercado_feria', 'parafina_gas', 'otro')),
  receipt_path text, -- ruta en el bucket de Storage "receipts"
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security — todo scoped a auth.uid()
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'accounts', 'account_balance_snapshots',
    'income_items', 'fixed_expenses', 'variable_budgets', 'savings_commitments',
    'capex_items', 'variable_actuals', 'month_closes', 'reminders', 'reminder_completions',
    'goals', 'goal_contributions', 'projection_assumptions',
    'household_income', 'household_expenses'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "owner_all" on %I', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- reminder_completions and goal_contributions reference user_id directly too
-- (denormalized on purpose) so the same simple policy works for all tables above.

-- Helpful indexes
create index if not exists idx_accounts_user on accounts(user_id);
create index if not exists idx_snapshots_user_month on account_balance_snapshots(user_id, month);
create index if not exists idx_month_closes_user_month on month_closes(user_id, month);
create index if not exists idx_goals_user on goals(user_id);
create index if not exists idx_household_expenses_user_month on household_expenses(user_id, month);
