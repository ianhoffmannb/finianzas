import { useAccounts } from '../../hooks/useAccounts';
import { useIncomeItems } from '../../hooks/useIncomeItems';
import { useFixedExpenses } from '../../hooks/useFixedExpenses';
import { useVariableActual } from '../../hooks/useVariableActual';
import { useVariableBudget } from '../../hooks/useVariableBudget';
import { useSavingsCommitments } from '../../hooks/useSavingsCommitments';
import { useCapexItems } from '../../hooks/useCapexItems';
import { useGoals } from '../../hooks/useGoals';
import { useMonthClose } from '../../hooks/useMonthClose';
import { usePlannedFlows } from '../../hooks/usePlannedFlows';
import { useAuth } from '../../contexts/AuthContext';
import { DonutChart } from '../charts/DonutChart';
import { flowSlices } from '../../utils/flow';
import { buildInsights } from '../../utils/insights';
import { VARIABLE_CATEGORIES } from '../../utils/categories';
import { formatCLP, formatPercent } from '../../utils/money';
import { formatMonthYear, addMonths } from '../../utils/date';

/** Reporte de una página, pensado para imprimir o guardar como PDF. */
export function MonthlyReport({ month, onClose }: { month: string; onClose: () => void }) {
  const { user } = useAuth();
  const accounts = useAccounts();
  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableActual = useVariableActual(month);
  const variableBudget = useVariableBudget();
  const savings = useSavingsCommitments();
  const capex = useCapexItems(month);
  const goals = useGoals();
  const prevClose = useMonthClose(addMonths(month, -1));
  const planned = usePlannedFlows();

  const flow = {
    income: income.total,
    fixed: fixed.total,
    variable: variableActual.amount,
    savings: savings.total,
    capex: capex.total,
  };
  const fcl = flow.income - flow.fixed - flow.variable - flow.savings - flow.capex;

  const prev = prevClose.close
    ? {
        income: prevClose.close.income_total ?? 0,
        fixed: prevClose.close.fixed_total ?? 0,
        variable: prevClose.close.variable_actual ?? 0,
        savings: prevClose.close.savings_actual ?? 0,
        capex: prevClose.close.capex_actual ?? 0,
      }
    : null;

  const capMap = new Map(VARIABLE_CATEGORIES.map((c) => [c.key, variableBudget.capOf(c.key)]));

  const insights = buildInsights({
    month,
    ...flow,
    variableByCategory: variableActual.byCategory,
    variableCapByCategory: capMap,
    netWorth: accounts.netWorth,
    liquid: accounts.totalLiquido,
    prev,
    goals: goals.rows,
    plannedNext: planned.pending
      .filter((p) => p.month > month)
      .slice(0, 4)
      .map((p) => ({ month: p.month, label: p.label, amount: p.amount, kind: p.kind })),
  });

  const usedCategories = VARIABLE_CATEGORIES.map((c) => ({
    ...c,
    spent: variableActual.amountOf(c.key),
    cap: variableBudget.capOf(c.key),
  })).filter((c) => c.spent > 0 || c.cap > 0);

  return (
    <div
      onClick={onClose}
      className="report-overlay"
      style={{ position: 'fixed', inset: 0, background: '#0F1729A6', zIndex: 60, overflowY: 'auto', padding: 24 }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="report-noprint" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); window.print(); }}>
            Guardar como PDF
          </button>
          <button className="btn btn-ghost" style={{ background: '#FFFFFF' }} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div
          className="report-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#FFFFFF', color: '#0F1729', borderRadius: 16, padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #0F1729', paddingBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '700 20px Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                Fin<span style={{ color: '#0F4CD9' }}>IAN</span>zas
              </span>
              <span style={{ font: '400 12px Outfit, sans-serif', color: '#6B7787' }}>
                Reporte de {formatMonthYear(month)} · {user?.email ?? ''}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '600 24px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(accounts.netWorth)}</div>
              <div style={{ font: '400 11.5px Outfit, sans-serif', color: '#6B7787' }}>patrimonio neto</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <ReportStat label="Ingresos" value={formatCLP(flow.income)} />
            <ReportStat label="Gastos" value={formatCLP(flow.fixed + flow.variable)} />
            <ReportStat label="Ahorro + capex" value={formatCLP(flow.savings + flow.capex)} />
            <ReportStat
              label="Flujo libre"
              value={formatCLP(fcl)}
              sub={flow.income > 0 ? `tasa ${formatPercent((fcl / flow.income) * 100, 1)}` : undefined}
              accent
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 22, alignItems: 'start' }}>
            <div>
              <div style={{ font: '600 12.5px Outfit, sans-serif', color: '#6B7787', paddingBottom: 8 }}>En qué se fue</div>
              <DonutChart slices={flowSlices(flow)} centerLabel="de tu ingreso" size={170} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {usedCategories.length > 0 && (
                <div>
                  <div style={{ font: '600 12.5px Outfit, sans-serif', color: '#6B7787', paddingBottom: 6 }}>Gastos variables por categoría</div>
                  <div className="ledger">
                    {usedCategories.map((c) => (
                      <div key={c.key} className="ledger-row" style={{ padding: '7px 0' }}>
                        <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>{c.label}</span>
                        <span style={{ font: '400 12px Outfit, sans-serif', color: c.cap > 0 && c.spent > c.cap ? '#B07219' : '#6B7787', minWidth: 90, textAlign: 'right' }}>
                          tope {formatCLP(c.cap)}
                        </span>
                        <span style={{ font: '500 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', minWidth: 90, textAlign: 'right' }}>
                          {formatCLP(c.spent)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ font: '600 12.5px Outfit, sans-serif', color: '#6B7787', paddingBottom: 6 }}>Qué dicen los números</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights.slice(0, 6).map((ins, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span
                        aria-hidden
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 99,
                          marginTop: 6,
                          flex: '0 0 6px',
                          background: ins.tone === 'good' ? '#0F7A58' : ins.tone === 'warn' ? '#B07219' : '#0F4CD9',
                        }}
                      />
                      <span style={{ font: '400 12px/1.45 Outfit, sans-serif' }}>
                        <strong style={{ fontWeight: 600 }}>{ins.title}.</strong> {ins.body}
                      </span>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <span style={{ font: '400 12px Outfit, sans-serif', color: '#6B7787' }}>
                      Carga tus ingresos y gastos del mes para que el reporte tenga qué analizar.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #EAEFF5', paddingTop: 10, display: 'flex', justifyContent: 'space-between', font: '400 10.5px Outfit, sans-serif', color: '#6B7787' }}>
            <span>Generado por FinIANzas · {new Date().toLocaleDateString('es-CL')}</span>
            <span>Hogar no entra en este reporte: esa plata no es tuya.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: '#F4F7FB', borderRadius: 12, padding: '10px 12px', borderTop: accent ? '2px solid #0F4CD9' : undefined }}>
      <div style={{ font: '600 11px Outfit, sans-serif', color: accent ? '#0F4CD9' : '#6B7787' }}>{label}</div>
      <div style={{ font: '600 17px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ font: '400 11px Outfit, sans-serif', color: '#0F7A58' }}>{sub}</div>}
    </div>
  );
}
