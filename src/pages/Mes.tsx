import type { CSSProperties, ReactNode } from 'react';
import { useMonth } from '../contexts/MonthContext';
import { useCierre } from '../contexts/CierreContext';
import { useIncomeItems } from '../hooks/useIncomeItems';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useVariableBudget } from '../hooks/useVariableBudget';
import { useVariableActual } from '../hooks/useVariableActual';
import { useSavingsCommitments } from '../hooks/useSavingsCommitments';
import { useCapexItems } from '../hooks/useCapexItems';
import { useMonthClose } from '../hooks/useMonthClose';
import { EditableList } from '../components/EditableList';
import { Chip } from '../components/Chip';
import { MoneyInput } from '../components/MoneyInput';
import { CategoryBars } from '../components/charts/CategoryBars';
import { VARIABLE_CATEGORIES } from '../utils/categories';
import { formatCLP, formatPercent, formatSignedCLP } from '../utils/money';
import { formatMonthYear, addMonths, formatDayMonth, daysUntil } from '../utils/date';
import { NavLink } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export function Mes() {
  const { month, isCurrentMonth, goPrevMonth, goNextMonth } = useMonth();
  const cierre = useCierre();

  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableBudget = useVariableBudget();
  const variableActual = useVariableActual(month);
  const savings = useSavingsCommitments();
  const capex = useCapexItems(month);
  const prevClose = useMonthClose(addMonths(month, -1));

  const gastos = fixed.total + variableActual.amount;
  const libre = income.total - gastos - savings.total - capex.total;
  const savingsRate = income.total ? (libre / income.total) * 100 : 0;

  const upcoming = [...fixed.rows].sort((a, b) => a.due_day - b.due_day);

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1>Mes</h1>
          <span className="page-sub">presupuesto, flujo y vencimientos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border-soft)', background: 'var(--color-surface)', borderRadius: 99, overflow: 'hidden' }}>
            <button onClick={goPrevMonth} style={pillBtn(false)}>
              ‹
            </button>
            <span style={pillBtn(true)}>{formatMonthYear(month)}</span>
            <button onClick={goNextMonth} disabled={isCurrentMonth} style={{ ...pillBtn(false), color: isCurrentMonth ? 'var(--color-hairline-strong)' : undefined, cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}>
              ›
            </button>
          </div>
          <button className="btn btn-primary" onClick={cierre.open}>
            Cerrar el mes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20 }}>
        <KpiCard label="Ingresos" value={formatCLP(income.total)} sub={`${income.rows.length} fuentes`} />
        <KpiCard label="Gastos" value={formatCLP(gastos)} sub="fijos + variables" />
        <KpiCard label="Ahorro + capex" value={formatCLP(savings.total + capex.total)} sub={`${formatCLP(savings.total)} + ${formatCLP(capex.total)}`} />
        <KpiCard label="Flujo de caja libre" value={formatCLP(libre)} sub={`tasa de ahorro ${formatPercent(savingsRate, 1)}`} highlight />
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Section title="Ingresos" sub={formatMonthYear(month)}>
            <EditableList
              items={income.rows}
              addLabel="+ agregar ingreso"
              fields={[
                { key: 'name', label: 'Nombre', type: 'text' },
                { key: 'amount', label: 'Monto', type: 'money' },
                { key: 'certainty', label: 'Certeza', type: 'select', options: [{ value: 'fijo', label: 'Fijo' }, { value: 'variable', label: 'Variable' }] },
              ]}
              emptyDraft={{ name: '', amount: 0, certainty: 'fijo' }}
              toDraft={(i) => ({ name: i.name, amount: i.amount, certainty: i.certainty })}
              onCreate={(d) => income.insert(d as never)}
              onUpdate={(id, d) => income.update(id, d as never)}
              onDelete={(id) => income.remove(id)}
              renderRow={(item, a) => (
                <div className="ledger-row">
                  <span className="label">{item.name}</span>
                  <Chip kind={item.certainty === 'fijo' ? 'fijo' : 'variable'} />
                  <span className="amount">{formatCLP(item.amount)}</span>
                  <RowActions {...a} />
                </div>
              )}
            />
            <div className="ledger-row ledger-total">
              <span className="label">Total ingresos</span>
              <span className="amount">{formatCLP(income.total)}</span>
            </div>
          </Section>

          <Section title="Gastos fijos" sub={`${fixed.rows.length} ítems · ${formatPercent(income.total ? (fixed.total / income.total) * 100 : 0, 1)} del ingreso`}>
            <EditableList
              items={fixed.rows}
              addLabel="+ agregar gasto fijo"
              fields={[
                { key: 'name', label: 'Nombre', type: 'text' },
                { key: 'amount', label: 'Monto mensual', type: 'money' },
                { key: 'due_day', label: 'Día de cobro', type: 'day' },
              ]}
              emptyDraft={{ name: '', amount: 0, due_day: 1 }}
              toDraft={(i) => ({ name: i.name, amount: i.amount, due_day: i.due_day })}
              onCreate={(d) => fixed.insert(d as never)}
              onUpdate={(id, d) => fixed.update(id, d as never)}
              onDelete={(id) => fixed.remove(id)}
              renderRow={(item, a) => (
                <div className="ledger-row">
                  <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)', width: 24 }}>{String(item.due_day).padStart(2, '0')}</span>
                  <span className="label">{item.name}</span>
                  <span className="amount">{formatCLP(item.amount)}</span>
                  <RowActions {...a} />
                </div>
              )}
            />
            <div className="ledger-row ledger-subtotal">
              <span className="label">Subtotal fijos</span>
              <span className="amount">{formatCLP(fixed.total)}</span>
            </div>
          </Section>

          <Section title="Gastos variables" sub={`tope ${formatCLP(variableBudget.cap)} · real ${formatCLP(variableActual.amount)}`}>
            <div className="ledger">
              <div className="ledger-row" style={{ borderTop: 'none', paddingBottom: 6 }}>
                <span className="label" style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Categoría</span>
                <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)', width: 130, textAlign: 'right' }}>Tope</span>
                <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)', width: 130, textAlign: 'right' }}>Gastado</span>
              </div>
              {VARIABLE_CATEGORIES.map((c) => {
                const cap = variableBudget.capOf(c.key);
                const spent = variableActual.amountOf(c.key);
                const over = cap > 0 && spent > cap;
                return (
                  <div key={c.key} className="ledger-row">
                    <span className="label">
                      {c.label}
                      {over && (
                        <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-amber)' }}>
                          {' '}· {formatCLP(spent - cap)} sobre el tope
                        </span>
                      )}
                    </span>
                    <span style={{ width: 130, display: 'flex', justifyContent: 'flex-end' }}>
                      <MoneyInput compact value={cap} onCommit={(v) => variableBudget.setCap(c.key, v)} />
                    </span>
                    <span style={{ width: 130, display: 'flex', justifyContent: 'flex-end' }}>
                      <MoneyInput compact value={spent} onCommit={(v) => variableActual.setAmount(c.key, v)} />
                    </span>
                  </div>
                );
              })}
              <div className="ledger-row ledger-subtotal">
                <span className="label">Subtotal variables</span>
                <span style={{ font: '500 14px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', width: 130, textAlign: 'right' }}>
                  {formatCLP(variableBudget.cap)}
                </span>
                <span style={{ font: '600 14px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', width: 130, textAlign: 'right' }}>
                  {formatCLP(variableActual.amount)}
                </span>
              </div>
            </div>
            {variableActual.amount > 0 && (
              <div style={{ paddingTop: 16 }}>
                <CategoryBars
                  rows={VARIABLE_CATEGORIES.map((c) => ({
                    key: c.key,
                    label: c.label,
                    spent: variableActual.amountOf(c.key),
                    cap: variableBudget.capOf(c.key),
                  }))}
                />
              </div>
            )}
            <span style={{ font: '400 11px/1.5 Outfit, sans-serif', color: 'var(--color-graphite)', paddingTop: 10 }}>
              El tope es lo que te propusiste; lo gastado es lo que pasó. La marca vertical en cada barra es el tope.
            </span>
          </Section>

          <Section title="Ahorro comprometido">
            <EditableList
              items={savings.rows}
              addLabel="+ agregar ahorro comprometido"
              fields={[
                { key: 'label', label: 'Descripción', type: 'text' },
                { key: 'amount', label: 'Monto', type: 'money' },
              ]}
              emptyDraft={{ label: '', amount: 0 }}
              toDraft={(i) => ({ label: i.label, amount: i.amount })}
              onCreate={(d) => savings.insert(d as never)}
              onUpdate={(id, d) => savings.update(id, d as never)}
              onDelete={(id) => savings.remove(id)}
              renderRow={(item, a) => (
                <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)' }}>
                  <span className="label">{item.label}</span>
                  <span className="amount" style={{ color: 'var(--color-green)' }}>{formatCLP(item.amount)}</span>
                  <RowActions {...a} />
                </div>
              )}
            />
            <span style={{ font: '400 11px/1.5 Outfit, sans-serif', color: 'var(--color-graphite)', paddingTop: 8 }}>
              Se resta arriba del FCL, al lado de los fijos. Nunca aparece como sobrante.
            </span>
          </Section>

          <Section title="Capex personal">
            <EditableList
              items={capex.rows}
              addLabel="+ agregar capex"
              fields={[
                { key: 'label', label: 'Descripción', type: 'text' },
                { key: 'amount', label: 'Monto', type: 'money' },
              ]}
              emptyDraft={{ label: '', amount: 0, month }}
              toDraft={(i) => ({ label: i.label, amount: i.amount, month })}
              onCreate={(d) => capex.insert(d as never)}
              onUpdate={(id, d) => capex.update(id, d as never)}
              onDelete={(id) => capex.remove(id)}
              renderRow={(item, a) => (
                <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)' }}>
                  <span className="label">{item.label}</span>
                  <span className="amount" style={{ color: 'var(--color-amber)' }}>{formatCLP(item.amount)}</span>
                  <RowActions {...a} />
                </div>
              )}
            />
            <span style={{ font: '400 11px/1.5 Outfit, sans-serif', color: 'var(--color-graphite)', paddingTop: 8 }}>
              Cursos, salud y herramientas de trabajo. Es inversión en ti: no ensucia el gasto corriente.
            </span>
          </Section>

          <div className="card" style={{ background: 'var(--color-surface)', padding: '18px 24px' }}>
            <div className="ledger-row no-border" style={{ padding: '9px 0' }}>
              <span className="label" style={{ fontWeight: 400 }}>Total salidas del mes</span>
              <span className="amount">{formatCLP(gastos + savings.total + capex.total)}</span>
            </div>
            <div className="ledger-row ledger-total">
              <span className="label">Flujo de caja libre</span>
              <span className="amount">{formatCLP(libre)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Section title="Comparación con el mes anterior">
            {prevClose.close ? (
              <div className="ledger">
                <CompareRow label="Ingresos" prev={prevClose.close.income_total ?? 0} curr={income.total} />
                <CompareRow label="Fijos" prev={prevClose.close.fixed_total ?? 0} curr={fixed.total} inverse />
                <CompareRow label="Variables" prev={prevClose.close.variable_actual ?? 0} curr={variableActual.amount} inverse />
                <CompareRow label="Ahorro" prev={prevClose.close.savings_actual ?? 0} curr={savings.total} />
                <div className="ledger-row ledger-subtotal">
                  <span className="label" style={{ fontWeight: 600 }}>FCL</span>
                  <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 74, textAlign: 'right' }}>
                    {formatCLP((prevClose.close.income_total ?? 0) - (prevClose.close.fixed_total ?? 0) - (prevClose.close.variable_actual ?? 0) - (prevClose.close.savings_actual ?? 0))}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState title="Sin mes anterior cerrado" body="Cuando cierres el mes anterior vas a ver la comparación acá." />
            )}
          </Section>

          <Section title="Vencimientos" sub="ordenados por día">
            <div className="ledger">
              {upcoming.map((u) => {
                const dateStr = `${month.slice(0, 7)}-${String(u.due_day).padStart(2, '0')}`;
                const days = daysUntil(dateStr);
                const today = isCurrentMonth && days === 0;
                const paid = isCurrentMonth && days < 0;
                return (
                  <div key={u.id} className="ledger-row" style={today ? { background: 'var(--color-amber-bg)' } : undefined}>
                    <span style={{ font: '500 12px Outfit, sans-serif', color: today ? 'var(--color-amber)' : 'var(--color-graphite)', width: 46 }}>{formatDayMonth(dateStr)}</span>
                    <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>{u.name}</span>
                    <span style={{ font: '400 12.5px Outfit, sans-serif', color: today ? 'var(--color-amber)' : 'var(--color-green)' }}>
                      {paid ? 'pagado' : today ? 'hoy' : `en ${days} días`}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          <NavLink to="/estados" className="btn btn-ghost" style={{ textAlign: 'left' }}>
            Ver estados financieros de {formatMonthYear(month)}
          </NavLink>
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 8 }}>
        <span style={{ font: '600 13px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{title}</span>
        {sub && <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={onEdit} style={iconBtn}>
        editar
      </button>
      <button onClick={onDelete} style={iconBtn}>
        eliminar
      </button>
    </div>
  );
}

function CompareRow({ label, prev, curr, inverse }: { label: string; prev: number; curr: number; inverse?: boolean }) {
  const delta = curr - prev;
  const good = inverse ? delta <= 0 : delta >= 0;
  return (
    <div className="ledger-row">
      <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>{label}</span>
      <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 74, textAlign: 'right' }}>{formatCLP(prev)}</span>
      <span style={{ font: '500 13px Outfit, sans-serif', color: good ? 'var(--color-green)' : 'var(--color-amber)', minWidth: 74, textAlign: 'right' }}>
        {formatSignedCLP(delta)}
      </span>
    </div>
  );
}

function KpiCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="card" style={{ padding: '18px 20px', gap: 6, borderTop: highlight ? '2px solid var(--color-accent)' : undefined }}>
      <span className="card-label" style={{ color: highlight ? 'var(--color-accent)' : undefined }}>{label}</span>
      <span style={{ font: '500 24px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ font: '400 12.5px Outfit, sans-serif', color: highlight ? 'var(--color-green)' : 'var(--color-graphite)' }}>{sub}</span>
    </div>
  );
}

const iconBtn: CSSProperties = {
  font: '400 11px Outfit, sans-serif',
  color: 'var(--color-graphite)',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
};

function pillBtn(active: boolean): CSSProperties {
  return {
    font: '500 13px Outfit, sans-serif',
    background: active ? 'var(--color-ink)' : 'transparent',
    color: active ? '#FFFFFF' : 'var(--color-graphite)',
    border: 0,
    padding: '10px 14px',
    cursor: active ? 'default' : 'pointer',
  };
}
