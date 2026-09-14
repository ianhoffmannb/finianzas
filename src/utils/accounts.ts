import type { Account } from '../types/models';

/** CLP equivalent of an account's balance. Debt accounts subtract from net worth. */
export function balanceInClp(account: Account): number {
  const raw = account.currency === 'USD' ? account.current_balance * (account.fx_rate ?? 0) : account.current_balance;
  return account.type === 'deuda' ? -Math.abs(raw) : raw;
}

export function sumAccountsClp(accounts: Account[]): number {
  return accounts.reduce((acc, a) => acc + balanceInClp(a), 0);
}
