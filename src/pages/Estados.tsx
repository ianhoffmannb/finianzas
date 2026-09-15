import { useState, type CSSProperties } from 'react';
import { useMonth } from '../contexts/MonthContext';
import { useAccounts } from '../hooks/useAccounts';
import { useIncomeItems } from '../hooks/useIncomeItems';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useVariableActual } from '../hooks/useVariableActual';
import { useSavingsCommitments } from '../hooks/useSavingsCommitments';
import { useCapexItems } from '../hooks/useCapexItems';
import { useMonthClose } from '../hooks/useMonthClose';
import { useMonthCloses, totalsOf, sumTotals } from '../hooks/useMonthCloses';
import { useSavingsAccrual } from '../hooks/useSavingsAccrual';
import { MonthlyReport } from '../components/report/MonthlyReport';
import { monthsFromStart } from '../utils/date';
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
  const closes = useMonthCloses();
  const accrual = useSavingsAccrual();
  const [view, setView] = useState<'mensual' | 'anual'>('mensual');
  const [reportOpen, setReportOpen] = useState(false);

  const year = Number(month.slice(0, 4));
  // El mes en curso todavía no tiene cierre: entra con los datos vivos.
  const liveTotals = {
    income: income.total,
    fixed: fixed.total,
    variable: variableActual.amount,
    savings: savings.total,
    capex: capex.total,
    fcl: income.total - fixed.total - variableActual.amount - savings.total - capex.total,
  };
  const yearRows = monthsFromStart(month)
    .filter((m) => Number(m.slice(0, 4)) === year)
    .map((m) => {
      const close = closes.byMonth.get(m);
      return { month: m, closed: !!close, totals: close ? totalsOf(close) : m === month ? liveTotals : null };
    });
  const yearTotal = sumTotals(yearRows.map((r) => r.totals).filter(Boolean) as ReturnType<typeof totalsOf>[]);

  const operResult = income.total - fixed.total - variableActual.amount;
  const fcl = operResult - capex.total - savings.total;

  const prev = prevClose.close;

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1>Estados financieros</h1>
          <span className="page-sub">
            {view === 'mensual' ? formatMonthYear(month) : `año ${year}`} · cifras en pesos chilenos
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface)', borderRadius: 99, overflow: 'hidden' }}>
            {(['mensual', 'anual'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  font: `${view === v ? 500 : 400} 13px Outfit, sans-serif`,
                  padding: '10px 18px',
                  background: view === v ? 'var(--color-ink)' : 'transparent',
                  color: view === v ? '#FFFFFF' : 'var(--color-graphite)',
                  border: 0,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => setReportOpen(true)}>
            Exportar reporte
          </button>
        </div>
      </div>

      {reportOpen && <MonthlyReport month={month} onClose={() => setReportOpen(false)} />}

      {view === 'mensual' && (
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
      )}

      {view === 'anual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: 'var(--fs-section)' }}>Resultado del año {year}</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
              {yearRows.filter((r) => r.closed).length} meses cerrados
            </span>
          </div>
          <div className="table-scroll">
            <div className="ledger" style={{ minWidth: 640 }}>
              <div className="ledger-row" style={{ borderTop: 'none', borderBottom: '1px solid var(--color-hairline-strong)' }}>
                <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Mes</span>
                <span style={yearHead}>Ingresos</span>
                <span style={yearHead}>Gastos</span>
                <span style={yearHead}>Ahorro</span>
                <span style={yearHead}>Capex</span>
                <span style={yearHead}>FCL</span>
              </div>
              {yearRows.map((row) => (
                <div className="ledger-row" key={row.month}>
                  <span className="label">
                    {formatMonthYear(row.month)}
                    {!row.closed && (
                      <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-amber)' }}>
                        {row.totals ? ' · en curso' : ' · sin cerrar'}
                      </span>
                    )}
                  </span>
                  <span style={yearCell}>{row.totals ? formatStatement(row.totals.income) : '—'}</span>
                  <span style={yearCell}>{row.totals ? formatStatement(-(row.totals.fixed + row.totals.variable)) : '—'}</span>
                  <span style={yearCell}>{row.totals ? formatStatement(-row.totals.savings) : '—'}</span>
                  <span style={yearCell}>{row.totals ? formatStatement(-row.totals.capex) : '—'}</span>
                  <span style={{ ...yearCell, fontWeight: 500 }}>{row.totals ? formatStatement(row.totals.fcl) : '—'}</span>
                </div>
              ))}
              <div className="ledger-row ledger-total">
                <span className="label">Acumulado {year}</span>
                <span style={yearCell}>{formatStatement(yearTotal.income)}</span>
                <span style={yearCell}>{formatStatement(-(yearTotal.fixed + yearTotal.variable))}</span>
                <span style={yearCell}>{formatStatement(-yearTotal.savings)}</span>
                <span style={yearCell}>{formatStatement(-yearTotal.capex)}</span>
                <span style={{ ...yearCell, fontWeight: 600 }}>{formatStatement(yearTotal.fcl)}</span>
              </div>
            </div>
          </div>
          <span style={{ font: '400 11px/1.6 Outfit, sans-serif', color: 'var(--color-graphite)' }}>
            Los meses cerrados vienen de su cierre; el mes en curso se calcula con lo que llevas cargado y por eso puede moverse.
          </span>
        </div>
      )}

      <div className="card" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="card-label" style={{ color: 'var(--color-green)' }}>Ahorro acumulado</span>
          <span style={{ font: '600 22px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', color: 'var(--color-green)' }}>
            {formatCLP(accrual.total)}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Cerrado</span>
          <span style={{ font: '500 16px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(accrual.closed)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Comprometido este mes</span>
          <span style={{ font: '500 16px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(accrual.currentCommitment)}</span>
        </div>
        <span style={{ font: '400 12px/1.5 Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1, minWidth: 240 }}>
          Se suma solo con cada cierre y va directo al saldo de la cuenta destino, así que no tienes que sumarlo a mano.
        </span>
      </div>
    </div>
  );
}

const yearHead: CSSProperties = { font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 96, textAlign: 'right' };
const yearCell: CSSProperties = { font: '400 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', minWidth: 96, textAlign: 'right' };

const statementHead: CSSProperties = { font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 96, textAlign: 'right' };
const statementCell: CSSProperties = { font: '400 14px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', minWidth: 96, textAlign: 'right' };
