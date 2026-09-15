import { useMonthCloses } from './useMonthCloses';
import { useSavingsCommitments } from './useSavingsCommitments';

/**
 * Cuánto llevas ahorrado: lo que ya quedó registrado en cada cierre, más lo
 * comprometido del mes en curso (que todavía no se cierra).
 */
export function useSavingsAccrual() {
  const closes = useMonthCloses();
  const commitments = useSavingsCommitments();

  const closed = closes.accumulatedSavings;
  const currentCommitment = commitments.total;

  return {
    closed,
    currentCommitment,
    total: closed + currentCommitment,
    loading: closes.loading || commitments.loading,
    /** Ahorro que va dirigido a una cuenta concreta. */
    committedTo(accountId: string) {
      return commitments.rows.filter((c) => c.account_id === accountId).reduce((a, c) => a + c.amount, 0);
    },
  };
}
