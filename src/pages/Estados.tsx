import type { CSSProperties } from 'react';
import { useMonth } from '../contexts/MonthContext';
import { useAccounts } from '../hooks/useAccounts';
import { useIncomeItems } from '../hooks/useIncomeItems';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useVariableActual } from '../hooks/useVariableActual';
import { useSavingsCommitments } from '../hooks/useSavingsCommitments';
import { useCapexItems } from '../hooks/useCapexItems';
import { useMonthClose } from '../hooks/useMonthClose';
import { useNetWorthHistory } from '../hooks/useAccountSnapshots';
import { balanceInClp } from '../utils/accounts';
import { formatCLP, formatStatement, formatSignedCLP } from '../utils/money';
import { formatMonthYear, addMonths, shortMonthLabel } from '../utils/date';
import { EvolutionBars } from '../components/charts/EvolutionBars';

export function Estados() {
  const { month } = useMonth();
  const prevMonth = addMonths(month, -1);
  const accounts = useAccounts();
  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableActual = useVariableActual(month);
  const savings = useSavingsCommitments();
  const capex = useCapexItems(month);
  const prevClose = useMonthClose(prevMonth);
  const history = useNetWorthHistory(6);

  const operResult = income.total - fixed.total - variableActual.amount;
  const fcl = operResult - capex.total - savings.total;

  const prev = prevClose.close;

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1>Estados financieros</h1>
          <span className="page-sub">{formatMonthYear(month)} · cifras en pesos chilenos</span>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: 'var(--fs-section)', paddingBottom: 14 }}>Estado de resultados</span>
          <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)', borderTop: 'none' }}>
            <span className="label" />
            <span style={statementHead}>{formatMonthYear(month)}</span>
            <span style={statementHead}>{formatMonthYear(prevMonth)}</span>
          </div>
          <div className="ledger-row no-border" style={{ padding: '12px 0 6px' }}>
            <span style={{ font: '600 13px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Ingresos</span>
          </div>
          {income.rows.map((it) => (
            <div className="ledger-row" key={it.id}>
              <span className="label" style={{ paddingLeft: 14 }}>{it.name}</span>
              <span style={statementCell}>{formatStatement(it.amount)}</span>
              <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>—</span>
            </div>
          ))}
          <div className="ledger-row ledger-subtotal">
            <span className="label" style={{ fontWeight: 500 }}>Total ingresos</span>
            <span style={{ ...statementCell, fontWeight: 600 }}>{formatStatement(income.total)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>{prev ? formatStatement(prev.income_total ?? 0) : '—'}</span>
          </div>

          <div className="ledger-row no-border" style={{ padding: '18px 0 6px', marginTop: 12 }}>
            <span style={{ font: '600 13px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Gastos operacionales</span>
          </div>
          <div className="ledger-row">
            <span className="label" style={{ paddingLeft: 14 }}>Fijos</span>
            <span style={statementCell}>{formatStatement(-fixed.total)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>{prev ? formatStatement(-(prev.fixed_total ?? 0)) : '—'}</span>
          </div>
          <div className="ledger-row">
            <span className="label" style={{ paddingLeft: 14 }}>Variables</span>
            <span style={statementCell}>{formatStatement(-variableActual.amount)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>{prev ? formatStatement(-(prev.variable_actual ?? 0)) : '—'}</span>
          </div>
          <div className="ledger-row ledger-subtotal">
            <span className="label" style={{ fontWeight: 500 }}>Total gastos</span>
            <span style={{ ...statementCell, fontWeight: 600 }}>{formatStatement(-(fixed.total + variableActual.amount))}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>{prev ? formatStatement(-((prev.fixed_total ?? 0) + (prev.variable_actual ?? 0))) : '—'}</span>
          </div>

          <div className="ledger-row" style={{ background: 'var(--color-surface)', marginTop: 12, borderTop: '1px solid var(--color-hairline)' }}>
            <span className="label" style={{ fontWeight: 600, paddingLeft: 10 }}>Resultado operacional</span>
            <span style={{ ...statementCell, fontWeight: 600 }}>{formatStatement(operResult)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)', paddingRight: 10 }}>
              {prev ? formatStatement((prev.income_total ?? 0) - (prev.fixed_total ?? 0) - (prev.variable_actual ?? 0)) : '—'}
            </span>
          </div>

          <div className="ledger-row" style={{ marginTop: 12 }}>
            <span className="label" style={{ paddingLeft: 14 }}>Capex personal</span>
            <span style={{ ...statementCell, color: 'var(--color-amber)' }}>{formatStatement(-capex.total)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>{prev ? formatStatement(-(prev.capex_actual ?? 0)) : '—'}</span>
          </div>
          <div className="ledger-row">
            <span className="label" style={{ paddingLeft: 14 }}>Ahorro comprometido</span>
            <span style={{ ...statementCell, color: 'var(--color-green)' }}>{formatStatement(-savings.total)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)' }}>{prev ? formatStatement(-(prev.savings_actual ?? 0)) : '—'}</span>
          </div>
          <div className="ledger-row ledger-total">
            <span className="label">Flujo de caja libre</span>
            <span style={{ ...statementCell, fontWeight: 600, fontSize: 17 }}>{formatStatement(fcl)}</span>
            <span style={{ ...statementCell, color: 'var(--color-graphite)', fontWeight: 500, fontSize: 17 }}>
              {prev ? formatStatement((prev.income_total ?? 0) - (prev.fixed_total ?? 0) - (prev.variable_actual ?? 0) - (prev.capex_actual ?? 0) - (prev.savings_actual ?? 0)) : '—'}
            </span>
          </div>
          <span style={{ font: '400 11px/1.6 Outfit, sans-serif', color: 'var(--color-graphite)', paddingTop: 12 }}>
            El ahorro se resta como compromiso, no como resultado. El capex baja del operacional para que el mes se compare limpio contra otros meses.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: 'var(--fs-section)', paddingBottom: 14 }}>Balance general</span>
            <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)', borderTop: 'none' }}>
              <span className="label" />
              <span style={statementHead}>{formatMonthYear(month)}</span>
            </div>
            <div className="ledger-row no-border" style={{ padding: '12px 0 6px' }}>
              <span style={{ font: '600 13px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Activos</span>
            </div>
            {[...accounts.liquido, ...accounts.invertido].map((a) => (
              <div className="ledger-row" key={a.id}>
                <span className="label" style={{ paddingLeft: 14 }}>
                  {a.name} <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{a.currency === 'USD' ? 'líquido' : ''}</span>
                </span>
                <span style={statementCell}>{formatStatement(balanceInClp(a))}</span>
              </div>
            ))}
            <div className="ledger-row ledger-subtotal">
              <span className="label" style={{ fontWeight: 500 }}>Total activos</span>
              <span style={{ ...statementCell, fontWeight: 600 }}>{formatStatement(accounts.totalLiquido + accounts.totalInvertido)}</span>
            </div>
            <div className="ledger-row no-border" style={{ padding: '18px 0 6px' }}>
              <span style={{ font: '600 13px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Pasivos</span>
            </div>
            {accounts.deuda.length === 0 ? (
              <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)' }}>
                <span className="label" style={{ paddingLeft: 14, color: 'var(--color-graphite)' }}>Sin deudas registradas</span>
                <span style={statementCell}>0</span>
              </div>
            ) : (
              accounts.deuda.map((a) => (
                <div className="ledger-row" key={a.id}>
                  <span className="label" style={{ paddingLeft: 14 }}>{a.name}</span>
                  <span style={{ ...statementCell, color: 'var(--color-red)' }}>{formatStatement(-Math.abs(balanceInClp(a)))}</span>
                </div>
              ))
            )}
            <div className="ledger-row ledger-total" style={{ marginTop: 12 }}>
              <span className="label">Patrimonio neto</span>
              <span style={{ ...statementCell, fontWeight: 600, fontSize: 17 }}>{formatStatement(accounts.netWorth)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: 'var(--fs-section)' }}>Evolución del patrimonio</span>
              <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>últimos {history.history.length} meses</span>
            </div>
            <EvolutionBars points={history.history.map((h, i) => ({ label: shortMonthLabel(h.month), value: h.total, highlight: i === history.history.length - 1 }))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
              {history.history.map((h) => (
                <span key={h.month}>{shortMonthLabel(h.month)}</span>
              ))}
            </div>
            <div className="ledger">
              {history.history.slice(-3).map((h, i, arr) => {
                const prevTotal = i > 0 ? arr[i - 1].total : null;
                const delta = prevTotal !== null ? h.total - prevTotal : null;
                return (
                  <div className="ledger-row" key={h.month}>
                    <span className="label" style={{ color: 'var(--color-graphite)' }}>{formatMonthYear(h.month)}</span>
                    <span style={statementCell}>{formatCLP(h.total)}</span>
                    <span style={{ ...statementCell, color: 'var(--color-green)' }}>{delta !== null ? formatSignedCLP(delta) : '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const statementHead: CSSProperties = { font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 96, textAlign: 'right' };
const statementCell: CSSProperties = { font: '400 14px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', minWidth: 96, textAlign: 'right' };
