import { useMemo } from 'react';
import { useCollection } from './useCollection';
import type { HouseholdExpense, HouseholdIncome } from '../types/models';

export function useHousehold(month: string) {
  const income = useCollection<HouseholdIncome>('household_income', [{ column: 'month', value: month }]);
  const expenses = useCollection<HouseholdExpense>('household_expenses', [{ column: 'month', value: month }], {
    column: 'spent_on',
  });

  const incomeRecord = income.rows[0] ?? null;
  const totalSpent = useMemo(() => expenses.rows.reduce((a, r) => a + r.amount, 0), [expenses.rows]);
  const pending = (incomeRecord?.amount ?? 0) - totalSpent;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses.rows) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return map;
  }, [expenses.rows]);

  async function setIncome(amount: number, receivedOn: string) {
    return income.upsert(
      { ...(incomeRecord ?? {}), month, amount, received_on: receivedOn },
      'user_id,month'
    );
  }

  return { income, expenses, incomeRecord, totalSpent, pending, byCategory, setIncome };
}
