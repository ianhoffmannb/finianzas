-- FinIANzas — migración 002
-- Ejecutar en el SQL editor de Supabase DESPUÉS de schema.sql.
-- Agrega: categorías de gastos variables, flujos programados, metas cumplidas,
-- y deja septiembre 2026 como primer mes de la historia.

-- ---------------------------------------------------------------------------
-- 1. Gastos variables por categoría (tope y gasto real)
-- ---------------------------------------------------------------------------
alter table variable_budgets add column if not exists category text;
update variable_budgets set category = 'otros' where category is null;
alter table variable_budgets alter column category set not null;
alter table variable_budgets alter column category set default 'otros';

create unique index if not exists variable_budgets_user_category_idx
  on variable_budgets (user_id, category);

alter table variable_actuals add column if not exists category text;
update variable_actuals set category = 'otros' where category is null;
alter table variable_actuals alter column category set not null;
alter table variable_actuals alter column category set default 'otros';

-- el unique viejo era (user_id, month); ahora la llave incluye la categoría
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'variable_actuals' and con.contype = 'u'
  loop
    execute format('alter table variable_actuals drop constraint %I', c.conname);
  end loop;
end $$;

create unique index if not exists variable_actuals_user_month_category_idx
  on variable_actuals (user_id, month, category);

-- ---------------------------------------------------------------------------
-- 2. Flujos programados: gastos e ingresos futuros (proyección de caja)
-- ---------------------------------------------------------------------------
create table if not exists planned_flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ingreso', 'gasto')),
  label text not null,
  amount numeric not null default 0,
  month date not null, -- mes en que se espera, siempre día 1
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmado', 'cancelado')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_planned_flows_user_month on planned_flows (user_id, month);

alter table planned_flows enable row level security;
drop policy if exists "owner_all" on planned_flows;
create policy "owner_all" on planned_flows
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Metas cumplidas
-- ---------------------------------------------------------------------------
alter table goals add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Septiembre 2026 es el primer mes: fuera todo lo anterior
-- ---------------------------------------------------------------------------
delete from account_balance_snapshots where month < date '2026-09-01';
delete from month_closes            where month < date '2026-09-01';
delete from capex_items             where month < date '2026-09-01';
delete from variable_actuals        where month < date '2026-09-01';
delete from goal_contributions      where month < date '2026-09-01';
delete from reminder_completions    where month < date '2026-09-01';
delete from household_income        where month < date '2026-09-01';
delete from household_expenses      where month < date '2026-09-01';
delete from planned_flows           where month < date '2026-09-01';
