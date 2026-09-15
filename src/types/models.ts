// Domain types mirroring supabase/schema.sql. Kept snake_case to match the
// DB columns 1:1 — no mapping layer between rows and app state.

export type AccountType = 'liquido' | 'invertido' | 'deuda';
export type Currency = 'CLP' | 'USD';
export type Certainty = 'fijo' | 'variable';
export type GoalHorizon = '1y' | '3y' | '5y' | '10y' | 'recurrente';
export type GoalCategory = 'financiera' | 'de_vida';
export type MonthCloseStatus = 'open' | 'closed';
export type HouseholdCategory = 'supermercado_feria' | 'parafina_gas' | 'otro';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  current_balance: number;
  fx_rate: number | null;
  credit_limit: number | null;
  due_day: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface AccountBalanceSnapshot {
  id: string;
  account_id: string;
  user_id: string;
  month: string; // yyyy-mm-01
  balance: number;
  balance_clp: number;
  created_at: string;
}

export interface IncomeItem {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  certainty: Certainty;
  active: boolean;
  sort_order: number;
}

export interface FixedExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  is_annual: boolean;
  annual_amount: number | null;
  category: string | null;
  active: boolean;
  sort_order: number;
}

export interface VariableBudget {
  id: string;
  user_id: string;
  label: string;
  category: string;
  monthly_cap: number;
  active: boolean;
}

export interface SavingsCommitment {
  id: string;
  user_id: string;
  account_id: string | null;
  label: string;
  amount: number;
  active: boolean;
}

export interface CapexItem {
  id: string;
  user_id: string;
  month: string;
  label: string;
  amount: number;
  created_at: string;
}

export interface VariableActual {
  id: string;
  user_id: string;
  month: string;
  category: string;
  amount: number;
}

export interface MonthClose {
  id: string;
  user_id: string;
  month: string;
  status: MonthCloseStatus;
  usd_clp_rate: number | null;
  income_total: number | null;
  fixed_total: number | null;
  variable_actual: number | null;
  savings_actual: number | null;
  capex_actual: number | null;
  net_worth_result: number | null;
  step_data: Record<string, unknown>;
  closed_at: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  day_of_month: number;
  title: string;
  body: string;
  active: boolean;
}

export interface ReminderCompletion {
  id: string;
  reminder_id: string;
  user_id: string;
  month: string;
  done: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  horizon: GoalHorizon;
  category: GoalCategory;
  assumes_future_salary: boolean;
  monthly_contribution: number;
  recurs_yearly: boolean;
  active: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  month: string;
  amount: number;
}

export interface ProjectionAssumptions {
  id: string;
  user_id: string;
  graduation_date: string | null;
  milestone_date: string | null;
  monthly_income_post_grad: number;
  savings_rate: number;
  expected_return: number;
  expense_inflation: number;
  conservative_factor: number;
  optimistic_factor: number;
  updated_at: string;
}

export interface HouseholdIncome {
  id: string;
  user_id: string;
  month: string;
  amount: number;
  received_on: string | null;
}

export interface HouseholdExpense {
  id: string;
  user_id: string;
  month: string;
  spent_on: string;
  label: string;
  amount: number;
  category: HouseholdCategory;
  receipt_path: string | null;
  created_at: string;
}

export type PlannedFlowKind = 'ingreso' | 'gasto';
export type PlannedFlowStatus = 'pendiente' | 'confirmado' | 'cancelado';

export interface PlannedFlow {
  id: string;
  user_id: string;
  kind: PlannedFlowKind;
  label: string;
  amount: number;
  month: string;
  status: PlannedFlowStatus;
  notes: string | null;
  created_at: string;
}
