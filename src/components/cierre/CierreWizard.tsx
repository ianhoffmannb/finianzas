import { useMemo, useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { useIncomeItems } from '../../hooks/useIncomeItems';
import { useFixedExpenses } from '../../hooks/useFixedExpenses';
import { useVariableActual } from '../../hooks/useVariableActual';
import { useVariableBudget } from '../../hooks/useVariableBudget';
import { useSavingsCommitments } from '../../hooks/useSavingsCommitments';
import { useCapexItems } from '../../hooks/useCapexItems';
import { useGoals, requiredMonthly } from '../../hooks/useGoals';
import { useMonthClose } from '../../hooks/useMonthClose';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCLP, formatSignedCLP, formatUSD } from '../../utils/money';
import { formatMonthYear, currentMonthKey } from '../../utils/date';
import { MoneyInput } from '../MoneyInput';
import { VARIABLE_CATEGORIES } from '../../utils/categories';

const STEP_TITLES = ['Ingresos del mes', 'Saldos al cierre', 'Aportes a metas', 'Resumen y confirmación'];

export function CierreWizard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const month = currentMonthKey();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const accounts = useAccounts();
  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableActual = useVariableActual(month);
  const variableBudget = useVariableBudget();
  const savings = useSavingsCommitments();
  const capex = useCapexItems(month);
  const goals = useGoals();
  const monthClose = useMonthClose(month);

  // Every field is "edit on top of what the DB says": null means untouched, so
  // the stored value still shows once it loads. Seeding state up front would
  // freeze the defaults captured on the first render, before any data arrives.
  const [incomeAmounts, setIncomeAmounts] = useState<Record<string, number>>({});
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [usdRateEdit, setUsdRateEdit] = useState<number | null>(null);
  const [variableEdits, setVariableEdits] = useState<Record<string, number>>({});
  const [goalContribs, setGoalContribs] = useState<Record<string, number>>({});

  const usdRate = usdRateEdit ?? accounts.rows.find((a) => a.currency === 'USD')?.fx_rate ?? 0;
  function variableOf(category: string) {
    return variableEdits[category] ?? variableActual.amountOf(category);
  }
  const variableReal = VARIABLE_CATEGORIES.reduce((a, c) => a + variableOf(c.key), 0);

  /**
   * El ahorro comprometido se suma solo al saldo de su cuenta destino: llega
   * prellenado para que no tengas que sumarlo a mano, y aun así lo puedes
   * corregir si el saldo real no calzó.
   */
  function suggestedBalance(accountId: string, current: number) {
    const committed = savings.rows
      .filter((sv) => sv.account_id === accountId)
      .reduce((acc, sv) => acc + sv.amount, 0);
    return current + committed;
  }

  function incomeAmount(id: string, fallback: number) {
    return incomeAmounts[id] ?? fallback;
  }
  function accountBalance(id: string, fallback: number) {
    return accountBalances[id] ?? suggestedBalance(id, fallback);
  }
  function goalContrib(id: string, fallback: number) {
    return goalContribs[id] ?? fallback;
  }

  const incomeTotal = useMemo(
    () => income.rows.reduce((a, r) => a + incomeAmount(r.id, r.amount), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [income.rows, incomeAmounts]
  );

  const netWorthResult = useMemo(() => {
    return accounts.rows.reduce((sum, a) => {
      const bal = accountBalance(a.id, a.current_balance);
      const clp = a.currency === 'USD' ? bal * usdRate : bal;
      return sum + (a.type === 'deuda' ? -Math.abs(clp) : clp);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 0);
  }, [accounts.rows, accountBalances, usdRate]);

  const fcl = incomeTotal - fixed.total - variableReal - savings.total - capex.total;

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      // 1. account balances + snapshots
      for (const a of accounts.rows) {
        const bal = accountBalance(a.id, a.current_balance);
        const patch = a.currency === 'USD' ? { current_balance: bal, fx_rate: usdRate } : { current_balance: bal };
        await accounts.update(a.id, patch as never);
        const clp = a.currency === 'USD' ? bal * usdRate : bal;
        const balanceClp = a.type === 'deuda' ? -Math.abs(clp) : clp;
        await supabase.from('account_balance_snapshots').upsert(
          { account_id: a.id, user_id: user.id, month, balance: bal, balance_clp: balanceClp },
          { onConflict: 'account_id,month' }
        );
      }

      // 2. income confirmations
      for (const it of income.rows) {
        const amt = incomeAmount(it.id, it.amount);
        if (amt !== it.amount) await income.update(it.id, { amount: amt } as never);
      }

      // 3. gasto variable real, categoría por categoría
      for (const c of VARIABLE_CATEGORIES) {
        const value = variableOf(c.key);
        if (value !== variableActual.amountOf(c.key)) await variableActual.setAmount(c.key, value);
      }

      // 4. goal contributions — apply only the delta against what this month
      // already contributed, so re-closing a month doesn't double-count.
      const { data: priorRows } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month);
      const prior = new Map((priorRows ?? []).map((r: { goal_id: string; amount: number }) => [r.goal_id, r.amount]));

      for (const g of goals.rows) {
        const contrib = goalContrib(g.id, g.monthly_contribution);
        const already = prior.get(g.id) ?? 0;
        if (contrib === already) continue;
        await supabase.from('goal_contributions').upsert(
          { goal_id: g.id, user_id: user.id, month, amount: contrib } as never,
          { onConflict: 'goal_id,month' }
        );
        await goals.update(g.id, { current_amount: g.current_amount + contrib - already } as never);
      }

      // 5. finalize month close
      await monthClose.finalize({
        usd_clp_rate: usdRate,
        income_total: incomeTotal,
        fixed_total: fixed.total,
        variable_actual: variableReal,
        savings_actual: savings.total,
        capex_actual: capex.total,
        net_worth_result: netWorthResult,
        step_data: { incomeAmounts, accountBalances, usdRate, variableReal, variableEdits, goalContribs },
      });

      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error al cerrar el mes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#0F1729A6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid #D9DCD6', width: '100%', maxWidth: 720, maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid var(--color-hairline)' }}>
          <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Cierre de {formatMonthYear(month)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {!done && <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>paso {step} de 4</span>}
            <button onClick={onClose} style={{ font: '400 16px Outfit, sans-serif', background: 'transparent', border: 0, color: 'var(--color-graphite)', cursor: 'pointer', borderRadius: 99, padding: '0 4px' }}>
              ✕
            </button>
          </div>
        </div>

        {!done && (
          <div style={{ display: 'flex', gap: 4, padding: '0 28px', marginTop: 16 }}>
            {[1, 2, 3, 4].map((s) => (
              <span key={s} style={{ flex: 1, height: 3, background: s <= step ? 'var(--color-ink)' : 'var(--color-hairline)' }} />
            ))}
          </div>
        )}

        {done ? (
          <div style={{ padding: '48px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <span style={{ font: '600 24px Outfit, sans-serif' }}>{formatMonthYear(month)} quedó cerrado.</span>
            <span style={{ font: '400 14px/1.6 Outfit, sans-serif', color: 'var(--color-graphite)', maxWidth: 420 }}>
              Patrimonio resultante {formatCLP(netWorthResult)}. Ya puedes ver el mes que viene abierto en Inicio y Mes.
            </span>
            <button className="btn btn-primary" onClick={onClose}>
              Listo
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '20px 28px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ font: '600 24px Outfit, sans-serif', letterSpacing: '-0.01em' }}>{STEP_TITLES[step - 1]}</span>
              <span style={{ font: '400 14px/1.55 Outfit, sans-serif', color: 'var(--color-graphite)' }}>{stepSubtitle(step)}</span>
            </div>

            <div style={{ padding: '16px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {income.rows.map((it) => (
                    <div key={it.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ font: '500 13px Outfit, sans-serif' }}>{it.name}</span>
                        <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>plantilla {formatCLP(it.amount)}</span>
                      </div>
                      <MoneyInput value={incomeAmount(it.id, it.amount)} onChange={(v) => setIncomeAmounts((s) => ({ ...s, [it.id]: v }))} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-hairline-strong)', paddingTop: 12 }}>
                    <span style={{ font: '500 13px Outfit, sans-serif' }}>Total ingresos</span>
                    <span style={{ font: '600 15px Outfit, sans-serif' }}>{formatCLP(incomeTotal)}</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span style={{ font: '500 13px Outfit, sans-serif' }}>Dólar observado</span>
                    <MoneyInput value={usdRate} onChange={setUsdRateEdit} prefix="$" suffix="CLP" />
                  </div>
                  <div />
                  {accounts.rows.map((a) => {
                    const bal = accountBalance(a.id, a.current_balance);
                    const clp = a.currency === 'USD' ? bal * usdRate : bal;
                    const committed = savings.rows.filter((sv) => sv.account_id === a.id).reduce((acc, sv) => acc + sv.amount, 0);
                    return (
                      <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ font: '500 13px Outfit, sans-serif' }}>{a.name}</span>
                          <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                            antes {a.currency === 'USD' ? formatUSD(a.current_balance) : formatCLP(a.current_balance)}
                          </span>
                        </div>
                        <MoneyInput value={bal} onChange={(v) => setAccountBalances((s) => ({ ...s, [a.id]: v }))} prefix={a.currency === 'USD' ? 'US$' : '$'} />
                        {committed > 0 && accountBalances[a.id] === undefined && (
                          <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-green)' }}>
                            incluye {formatCLP(committed)} de ahorro comprometido
                          </span>
                        )}
                        {a.currency === 'USD' && <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>= {formatCLP(clp)}</span>}
                      </div>
                    );
                  })}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--color-hairline)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ font: '500 13px Outfit, sans-serif' }}>Gasto variable real del mes</span>
                      <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                        tope {formatCLP(variableBudget.cap)} · total {formatCLP(variableReal)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                      {VARIABLE_CATEGORIES.map((c) => (
                        <label key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                            {c.label}
                            {variableBudget.capOf(c.key) > 0 && ` · tope ${formatCLP(variableBudget.capOf(c.key))}`}
                          </span>
                          <MoneyInput
                            value={variableOf(c.key)}
                            onChange={(v) => setVariableEdits((prev) => ({ ...prev, [c.key]: v }))}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {goals.rows.length === 0 && <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Sin metas activas todavía.</span>}
                  {goals.rows.map((g) => (
                    <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ font: '500 13px Outfit, sans-serif' }}>{g.name}</span>
                        <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>requiere {formatCLP(requiredMonthly(g))}/mes</span>
                      </div>
                      <MoneyInput value={goalContrib(g.id, g.monthly_contribution)} onChange={(v) => setGoalContribs((s) => ({ ...s, [g.id]: v }))} />
                    </div>
                  ))}
                  {goals.rows.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-hairline-strong)', paddingTop: 12 }}>
                      <span style={{ font: '500 13px Outfit, sans-serif' }}>Total a metas este mes</span>
                      <span style={{ font: '600 15px Outfit, sans-serif' }}>{formatCLP(goals.rows.reduce((a, g) => a + goalContrib(g.id, g.monthly_contribution), 0))}</span>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SummaryRow label="Ingresos" value={incomeTotal} />
                  <SummaryRow label="Gastos fijos" value={-fixed.total} />
                  <SummaryRow label="Variables reales" value={-variableReal} />
                  <SummaryRow label="Ahorro comprometido" value={-savings.total} />
                  <SummaryRow label="Capex personal" value={-capex.total} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-ink)', paddingTop: 12, marginTop: 8 }}>
                    <span style={{ font: '600 15px Outfit, sans-serif' }}>Flujo de caja libre</span>
                    <span style={{ font: '600 17px Outfit, sans-serif' }}>{formatCLP(fcl)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, background: 'var(--color-surface)', borderRadius: 16, padding: '14px 18px' }}>
                    <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Patrimonio resultante</span>
                    <span style={{ font: '600 17px Outfit, sans-serif' }}>{formatCLP(netWorthResult)}</span>
                  </div>
                </div>
              )}

              {error && <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-red)' }}>{error}</span>}
            </div>

            <div style={{ borderTop: '1px solid var(--color-hairline)', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Patrimonio resultante</span>
                <span style={{ font: '600 20px Outfit, sans-serif' }}>
                  {formatCLP(netWorthResult)}{' '}
                  <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-green)' }}>{formatSignedCLP(netWorthResult - accounts.netWorth)}</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {step > 1 && (
                  <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
                    Atrás
                  </button>
                )}
                {step < 4 ? (
                  <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                    Siguiente
                  </button>
                ) : (
                  <button className="btn btn-primary" disabled={saving} onClick={handleFinish}>
                    {saving ? 'Cerrando…' : 'Confirmar cierre'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="ledger-row">
      <span className="label">{label}</span>
      <span className="amount">{formatCLP(value)}</span>
    </div>
  );
}

function stepSubtitle(step: number): string {
  switch (step) {
    case 1:
      return 'Confirma cada ingreso del mes. Si la ayudantía varió, ajusta el monto.';
    case 2:
      return 'Abre cada cuenta y copia el saldo. Es lo único que la app no puede saber sola.';
    case 3:
      return 'Cuánto se apartó realmente para cada meta este mes.';
    default:
      return 'Revisa los totales antes de confirmar. Después de cerrar, el mes siguiente queda abierto.';
  }
}
