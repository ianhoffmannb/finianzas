import type { ProjectionAssumptions } from '../types/models';

export interface YearRow {
  year: number;
  income: number;
  expense: number;
  fcl: number;
  netWorth: number;
}

/**
 * Rough multi-year projection: pre-graduation years extrapolate current
 * monthly income/expense; post-graduation years switch to the assumed
 * post-title income (scaled by the scenario factor) and a flat savings rate.
 * This is intentionally approximate — the app is explicit that everything
 * past the milestone line is the user's assumption, not a forecast.
 */
export function computeProjection(
  currentNetWorth: number,
  currentMonthlyIncome: number,
  currentMonthlyExpense: number,
  assumptions: ProjectionAssumptions,
  incomeFactor: number,
  startYear: number,
  years: number
): YearRow[] {
  const graduationYear = assumptions.graduation_date ? new Date(assumptions.graduation_date).getFullYear() : startYear + 1;
  const rows: YearRow[] = [];
  let netWorth = currentNetWorth;

  for (let i = 0; i < years; i++) {
    const year = startYear + i;
    const postGrad = year >= graduationYear;
    const monthlyIncome = postGrad ? assumptions.monthly_income_post_grad * incomeFactor : currentMonthlyIncome;
    const monthlyExpense = currentMonthlyExpense * Math.pow(1 + assumptions.expense_inflation, i);
    const annualIncome = monthlyIncome * 12;
    const annualExpense = monthlyExpense * 12;
    const annualFcl = postGrad ? annualIncome * assumptions.savings_rate : Math.max(annualIncome - annualExpense, 0);
    netWorth = netWorth * (1 + assumptions.expected_return) + annualFcl;
    rows.push({ year, income: annualIncome, expense: annualExpense, fcl: annualFcl, netWorth });
  }
  return rows;
}

export function milestoneIndex(milestoneDate: string | null, startYear: number, years: number): number | undefined {
  if (!milestoneDate) return undefined;
  const d = new Date(milestoneDate);
  const fraction = d.getFullYear() - startYear + d.getMonth() / 12;
  if (fraction < 0 || fraction > years - 1) return undefined;
  return fraction;
}
