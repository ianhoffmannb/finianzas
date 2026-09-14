import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { useAccounts } from '../hooks/useAccounts';
import { useIncomeItems } from '../hooks/useIncomeItems';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useVariableActual } from '../hooks/useVariableActual';
import { useProjectionAssumptions } from '../hooks/useProjectionAssumptions';
import { useMonth } from '../contexts/MonthContext';
import { ProjectionChart } from '../components/charts/ProjectionChart';
import { computeProjection, milestoneIndex } from '../utils/projection';
import { formatCLP, formatPercent } from '../utils/money';

const YEARS = 6;

export function Proyecciones() {
  const { month } = useMonth();
  const navigate = useNavigate();
  const accounts = useAccounts();
  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableActual = useVariableActual(month);
  const { assumptions, configured, save } = useProjectionAssumptions();

  const [scenario, setScenario] = useState<'conservador' | 'base' | 'optimista'>('base');

  const startYear = new Date(month).getFullYear();
  const currentExpense = fixed.total + variableActual.amount;
  // Proyectar desde cero sería inventar: sin patrimonio ni ingresos cargados
  // las tres curvas saldrían de los valores por defecto, no de tus datos.
  const hasBasis = accounts.rows.length > 0 || income.total > 0;

  const base = useMemo(
    () => computeProjection(accounts.netWorth, income.total, currentExpense, assumptions, 1, startYear, YEARS),
    [accounts.netWorth, income.total, currentExpense, assumptions, startYear]
  );
  const conservador = useMemo(
    () => computeProjection(accounts.netWorth, income.total, currentExpense, assumptions, assumptions.conservative_factor, startYear, YEARS),
    [accounts.netWorth, income.total, currentExpense, assumptions, startYear]
  );
  const optimista = useMemo(
    () => computeProjection(accounts.netWorth, income.total, currentExpense, assumptions, assumptions.optimistic_factor, startYear, YEARS),
    [accounts.netWorth, income.total, currentExpense, assumptions, startYear]
  );

  const years = base.map((r) => String(r.year));
  const milestone = milestoneIndex(assumptions.milestone_date, startYear, YEARS);
  const active = scenario === 'base' ? base : scenario === 'conservador' ? conservador : optimista;

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1>Proyecciones</h1>
          <span className="page-sub">tres escenarios posibles a {startYear + YEARS - 1} · no son un pronóstico</span>
        </div>
      </div>

      {!hasBasis && (
        <EmptyState
          title="Todavía no hay desde dónde proyectar."
          body="Las tres curvas parten de tu patrimonio y tu ingreso de hoy. Carga al menos una cuenta con su saldo y tus ingresos del mes, y esta pantalla empieza a tener sentido."
          actionLabel="Agregar primera cuenta"
          onAction={() => navigate('/cuentas')}
        />
      )}

      {!configured && hasBasis && (
        <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-amber)' }}>
          Los supuestos de abajo son valores por defecto de la app, no tuyos. Ajústalos para que la proyección sea tuya.
        </span>
      )}

      <div className="card" style={{ background: 'var(--color-amber-bg)', flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-amber)', paddingTop: 2, whiteSpace: 'nowrap' }}>Fechas inciertas</span>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', flex: 1 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Egreso / graduación</span>
            <input type="date" value={assumptions.graduation_date ?? ''} onChange={(e) => save({ graduation_date: e.target.value })} style={dateInput} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Hito / examen de grado</span>
            <input type="date" value={assumptions.milestone_date ?? ''} onChange={(e) => save({ milestone_date: e.target.value })} style={dateInput} />
          </label>
        </div>
        <span style={{ font: '400 13px/1.55 Outfit, sans-serif', color: 'var(--color-ink)', flex: 2, minWidth: 220, textWrap: 'pretty' }}>
          Todo lo que ves a la derecha de la línea es supuesto tuyo, no cálculo de la app.
        </span>
      </div>

      {hasBasis && (
      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1.45fr) minmax(0,1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: 'var(--fs-section)' }}>Patrimonio proyectado</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>pesos chilenos</span>
          </div>
          <div className="card" style={{ padding: '22px 24px 18px' }}>
            <ProjectionChart
              series={{ base: base.map((r) => r.netWorth), conservador: conservador.map((r) => r.netWorth), optimista: optimista.map((r) => r.netWorth) }}
              years={years}
              milestoneIndex={milestone}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
              {years.map((y) => (
                <span key={y}>{y}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', borderTop: '1px solid var(--color-hairline)', paddingTop: 14 }}>
              <LegendItem color="#0F4CD9" dashed label={`optimista · ${formatCLP(optimista[optimista.length - 1]?.netWorth ?? 0)}`} />
              <LegendItem color="#0F4CD9" bold label={`base · ${formatCLP(base[base.length - 1]?.netWorth ?? 0)}`} />
              <LegendItem color="#6B7787" dotted label={`conservador · ${formatCLP(conservador[conservador.length - 1]?.netWorth ?? 0)}`} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: 'var(--fs-section)' }}>Flujo de caja proyectado — escenario {scenario}</span>
              <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>se recalcula en cada cierre</span>
            </div>
            <div className="table-scroll">
              <div className="ledger" style={{ minWidth: 560 }}>
                <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)', borderTop: 'none' }}>
                  <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Año</span>
                  <span style={tableHead}>Ingreso</span>
                  <span style={tableHead}>Gasto</span>
                  <span style={tableHead}>FCL anual</span>
                  <span style={{ ...tableHead, minWidth: 120 }}>Patrimonio</span>
                </div>
                {active.map((row, i) => (
                  <div className={`ledger-row${i === active.length - 1 ? ' ledger-total' : ''}`} key={row.year}>
                    <span className="label">{row.year}</span>
                    <span style={tableCell}>{Math.round(row.income).toLocaleString('es-CL')}</span>
                    <span style={tableCell}>({Math.round(row.expense).toLocaleString('es-CL')})</span>
                    <span style={tableCell}>{Math.round(row.fcl).toLocaleString('es-CL')}</span>
                    <span style={{ ...tableCell, minWidth: 120, fontWeight: 500 }}>{Math.round(row.netWorth).toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </div>
            <span style={{ font: '400 11px/1.6 Outfit, sans-serif', color: 'var(--color-graphite)' }}>
              Cada cierre de mes reemplaza el dato proyectado del período por el real y vuelve a correr los tres escenarios desde ahí.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 26 }}>
          <div style={{ display: 'flex', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface)', borderRadius: 99, overflow: 'hidden' }}>
            {(['conservador', 'base', 'optimista'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                style={{
                  flex: 1,
                  font: `${scenario === s ? 500 : 400} 12px Outfit, sans-serif`,
                  padding: '11px 8px',
                  background: scenario === s ? 'var(--color-ink)' : 'transparent',
                  color: scenario === s ? '#FFFFFF' : 'var(--color-graphite)',
                  border: 0,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 24, gap: 22 }}>
            <span className="card-label">Supuestos · escenario base</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '400 13px Outfit, sans-serif' }}>Ingreso mensual post-título</span>
              </div>
              <div className="money-input">
                <span className="prefix">$</span>
                <input
                  value={assumptions.monthly_income_post_grad.toLocaleString('es-CL')}
                  onChange={(e) => save({ monthly_income_post_grad: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                />
              </div>
              <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                conservador {formatCLP(assumptions.monthly_income_post_grad * assumptions.conservative_factor)} · optimista{' '}
                {formatCLP(assumptions.monthly_income_post_grad * assumptions.optimistic_factor)}
              </span>
            </div>

            <SliderField
              label="Tasa de ahorro"
              value={assumptions.savings_rate}
              min={0.1}
              max={0.5}
              onChange={(v) => save({ savings_rate: v })}
            />
            <SliderField
              label="Retorno real esperado"
              value={assumptions.expected_return}
              min={0}
              max={0.15}
              onChange={(v) => save({ expected_return: v })}
            />
            <SliderField
              label="Inflación de gastos"
              value={assumptions.expense_inflation}
              min={0}
              max={0.1}
              onChange={(v) => save({ expense_inflation: v })}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--color-hairline)', paddingTop: 18 }}>
              <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Patrimonio a {startYear + YEARS - 1}</span>
              <span style={{ font: '600 26px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(base[base.length - 1]?.netWorth ?? 0)}</span>
            </div>
          </div>

          <span style={{ font: '400 11px/1.6 Outfit, sans-serif', color: 'var(--color-graphite)' }}>
            Los tres escenarios se dibujan siempre juntos: el base sólido, los otros dos punteados. Nunca se muestra uno solo, para que ninguna línea se lea como promesa.
          </span>
        </div>
      </div>
      )}
    </div>
  );
}

function SliderField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ font: '400 13px Outfit, sans-serif' }}>{label}</span>
        <span style={{ font: '500 14px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatPercent(value * 100, 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0F4CD9' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
        <span>{formatPercent(min * 100, 0)}</span>
        <span>{formatPercent(max * 100, 0)}</span>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed, dotted, bold }: { color: string; label: string; dashed?: boolean; dotted?: boolean; bold?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: `${bold ? 500 : 400} 12px Outfit, sans-serif`, color: bold ? 'var(--color-ink)' : 'var(--color-graphite)' }}>
      <span
        style={{
          width: 18,
          height: bold ? 3 : 2,
          background: dashed || dotted ? 'transparent' : color,
          borderTop: dashed ? `2px dashed ${color}` : dotted ? `2px dotted ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

const dateInput = { border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '8px 10px', font: '400 13px Outfit, sans-serif' };
const tableHead: CSSProperties = { font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 100, textAlign: 'right' };
const tableCell: CSSProperties = { font: '400 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', minWidth: 100, textAlign: 'right' };
