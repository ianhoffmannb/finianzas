import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useGoals, requiredMonthly, progressPct, monthsRemaining } from '../hooks/useGoals';
import { useGoalContributions } from '../hooks/useGoalContributions';
import { useIncomeItems } from '../hooks/useIncomeItems';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useVariableActual } from '../hooks/useVariableActual';
import { useSavingsCommitments } from '../hooks/useSavingsCommitments';
import { useCapexItems } from '../hooks/useCapexItems';
import { useMonth } from '../contexts/MonthContext';
import { ProgressBar } from '../components/ProgressBar';
import { Chip } from '../components/Chip';
import { TrajectoryChart } from '../components/charts/TrajectoryChart';
import { EmptyState } from '../components/EmptyState';
import { MoneyInput } from '../components/MoneyInput';
import { formatCLP, formatPercent } from '../utils/money';
import { formatMonthYear } from '../utils/date';
import type { Goal, GoalHorizon } from '../types/models';

const HORIZON_LABEL: Record<GoalHorizon, string> = {
  '1y': '1 año',
  '3y': '3 años',
  '5y': '5 años',
  '10y': '10 años',
  recurrente: 'Recurrente',
};

type Draft = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'sort_order' | 'active' | 'current_amount'> & {
  current_amount: number;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  target_amount: 0,
  current_amount: 0,
  target_date: '',
  horizon: '1y',
  category: 'financiera',
  assumes_future_salary: false,
  monthly_contribution: 0,
  recurs_yearly: false,
};

export function Metas() {
  const goals = useGoals();
  const { month } = useMonth();
  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableActual = useVariableActual(month);
  const savings = useSavingsCommitments();
  const capex = useCapexItems(month);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingExisting, setEditingExisting] = useState<Goal | null>(null);

  const libre = income.total - fixed.total - variableActual.amount - savings.total - capex.total;
  const gap = Math.max(goals.monthlyRequired - libre, 0);

  const selected = goals.rows.find((g) => g.id === selectedId) ?? goals.rows[0] ?? null;
  const contributions = useGoalContributions(selected?.id ?? '');

  function openCreate() {
    setEditingExisting(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  }

  function openEdit(g: Goal) {
    setEditingExisting(g);
    setDraft({
      name: g.name,
      description: g.description ?? '',
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date ?? '',
      horizon: g.horizon,
      category: g.category,
      assumes_future_salary: g.assumes_future_salary,
      monthly_contribution: g.monthly_contribution,
      recurs_yearly: g.recurs_yearly,
    });
    setFormOpen(true);
  }

  async function submit() {
    if (editingExisting) {
      await goals.update(editingExisting.id, draft as never);
    } else {
      const result = await goals.insert(draft as never);
      if (result.data) setSelectedId(result.data.id);
    }
    setFormOpen(false);
  }

  const trajectory = useMemo(() => {
    if (!selected) return { real: [0], required: [0, 1] };
    const target = selected.target_amount || 1;
    const real =
      contributions.rows.length > 0
        ? cumulative(contributions.rows.map((c) => c.amount)).map((v) => v / target)
        : [0, selected.current_amount / target];
    const months = selected.target_date ? Math.max(monthsRemaining(selected.target_date), 1) : 12;
    const required = Array.from({ length: 13 }, (_, i) => Math.min(i / Math.min(months, 12), 1));
    return { real, required };
  }, [selected, contributions.rows]);

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1>Metas</h1>
          <span className="page-sub">
            {goals.rows.length} metas activas · {formatCLP(goals.monthlyRequired)}/mes para cumplirlas todas
          </span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          Nueva meta
        </button>
      </div>

      {goals.rows.length > 0 && (
        <div className="card" style={{ background: 'var(--color-amber-bg)', flexDirection: 'row', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <MiniStat label="Requerido / mes" value={formatCLP(goals.monthlyRequired)} />
          <MiniStat label="Disponible hoy" value={formatCLP(libre)} />
          <MiniStat label="Brecha" value={formatCLP(gap)} color="var(--color-amber)" />
          <span style={{ font: '400 12px/1.5 Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1, minWidth: 260 }}>
            Si la brecha no se cierra con tu ingreso actual, está bien: revisa qué metas suponen sueldo futuro. La app no la disfraza.
          </span>
        </div>
      )}

      {formOpen && (
        <GoalForm
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setFormOpen(false)}
          onSubmit={submit}
          isEditing={!!editingExisting}
        />
      )}

      {goals.rows.length === 0 ? (
        <EmptyState
          title="Todavía no hay metas."
          body="Una meta necesita tres datos: monto, fecha y por qué la quieres. Con eso la app calcula cuánto tendrías que apartar al mes y si tu flujo actual alcanza."
          actionLabel="Crear la primera meta"
          onAction={openCreate}
        />
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {goals.horizons.map((h) => {
              const items = goals.byHorizon.get(h) ?? [];
              if (items.length === 0) return null;
              return (
                <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{HORIZON_LABEL[h]}</span>
                  {items.map((g) => (
                    <GoalCard key={g.id} goal={g} selected={g.id === selected?.id} onClick={() => setSelectedId(g.id)} onEdit={() => openEdit(g)} />
                  ))}
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="card" style={{ padding: '26px 28px', position: 'sticky', top: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="card-label">Detalle de meta</span>
                  <span style={{ font: '600 24px Outfit, sans-serif', letterSpacing: '-0.01em' }}>{selected.name}</span>
                  {selected.description && <span style={{ font: '400 13px/1.5 Outfit, sans-serif', color: 'var(--color-graphite)' }}>{selected.description}</span>}
                </div>
                <button className="btn btn-ghost" onClick={() => openEdit(selected)} style={{ padding: '9px 15px' }}>
                  Editar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ font: '600 28px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(selected.current_amount)}</span>
                  <span style={{ font: '400 14px Outfit, sans-serif', color: 'var(--color-graphite)' }}>de {formatCLP(selected.target_amount)}</span>
                </div>
                <ProgressBar pct={progressPct(selected)} height={12} assumed={selected.assumes_future_salary} />
                <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                  <span>{formatPercent(progressPct(selected))} avanzado</span>
                  <span>faltan {formatCLP(Math.max(selected.target_amount - selected.current_amount, 0))}</span>
                </div>
              </div>

              <div className="ledger">
                <div className="ledger-row">
                  <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>Fecha objetivo</span>
                  <span style={{ font: '500 13px Outfit, sans-serif' }}>{selected.target_date ? formatMonthYear(selected.target_date) : '—'}</span>
                </div>
                <div className="ledger-row">
                  <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>Meses restantes</span>
                  <span style={{ font: '500 13px Outfit, sans-serif' }}>{selected.target_date ? Math.max(monthsRemaining(selected.target_date), 0) : '—'}</span>
                </div>
                <div className="ledger-row">
                  <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>Aporte necesario</span>
                  <span style={{ font: '500 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(requiredMonthly(selected))} / mes</span>
                </div>
                <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline-strong)' }}>
                  <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>Aporte actual</span>
                  <span style={{ font: '500 13px Outfit, sans-serif', color: 'var(--color-green)', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(selected.monthly_contribution)} / mes</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Trayectoria</span>
                <TrajectoryChart realPoints={trajectory.real} requiredPoints={trajectory.required} />
                <div style={{ display: 'flex', gap: 16, font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, height: 2, background: '#0F4CD9' }} /> real
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, height: 2, background: 'var(--color-hairline-strong)' }} /> requerido
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, selected, onClick, onEdit }: { goal: Goal; selected: boolean; onClick: () => void; onEdit: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: goal.assumes_future_salary ? '#FAFBFD' : selected ? '#FFFFFF' : 'var(--color-surface)',
        border: goal.assumes_future_salary ? '1px dashed var(--color-hairline-strong)' : selected ? '1.5px solid var(--color-accent)' : 'none',
        borderRadius: 20,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14 }}>
        <span style={{ font: '600 15px Outfit, sans-serif' }}>{goal.name}</span>
        <Chip kind={goal.assumes_future_salary ? 'supone' : goal.category === 'de_vida' ? 'devida' : 'fijo'} label={goal.assumes_future_salary ? undefined : goal.category === 'de_vida' ? undefined : 'FINANCIERA'} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ font: '500 15px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
          {formatCLP(goal.current_amount)} <span style={{ font: '400 14px Outfit, sans-serif', color: 'var(--color-graphite)' }}>/ {formatCLP(goal.target_amount)}</span>
        </span>
        <span style={{ font: '500 13px Outfit, sans-serif', color: goal.category === 'de_vida' ? 'var(--color-green)' : 'var(--color-accent)' }}>
          {formatPercent(progressPct(goal))}
        </span>
      </div>
      <ProgressBar pct={progressPct(goal)} assumed={goal.assumes_future_salary} color={goal.category === 'de_vida' ? 'green' : 'blue'} />
      <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
        <span>{goal.target_date ? formatMonthYear(goal.target_date) : 'sin fecha'}</span>
        <span>requiere {formatCLP(requiredMonthly(goal))}/mes</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="btn btn-ghost"
        style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: 11.5 }}
      >
        Editar
      </button>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ font: '400 12.5px Outfit, sans-serif', color: color ?? 'var(--color-graphite)' }}>{label}</span>
      <span style={{ font: '600 18px Outfit, sans-serif', color: color ?? 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function GoalForm({
  draft,
  setDraft,
  onCancel,
  onSubmit,
  isEditing,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isEditing: boolean;
}) {
  return (
    <div className="card" style={{ gap: 14 }}>
      <span className="card-label">{isEditing ? 'Editar meta' : 'Nueva meta'}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <Field label="Nombre">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Monto objetivo">
          <MoneyInput value={draft.target_amount} onChange={(v) => setDraft({ ...draft, target_amount: v })} />
        </Field>
        <Field label="Monto actual">
          <MoneyInput value={draft.current_amount} onChange={(v) => setDraft({ ...draft, current_amount: v })} />
        </Field>
        <Field label="Fecha objetivo">
          <input type="date" value={draft.target_date ?? ''} onChange={(e) => setDraft({ ...draft, target_date: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Horizonte">
          <select value={draft.horizon} onChange={(e) => setDraft({ ...draft, horizon: e.target.value as GoalHorizon })} style={inputStyle}>
            {Object.entries(HORIZON_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría">
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Goal['category'] })} style={inputStyle}>
            <option value="financiera">Financiera</option>
            <option value="de_vida">De vida</option>
          </select>
        </Field>
        <Field label="Aporte mensual actual">
          <MoneyInput value={draft.monthly_contribution} onChange={(v) => setDraft({ ...draft, monthly_contribution: v })} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <input type="checkbox" checked={draft.assumes_future_salary} onChange={(e) => setDraft({ ...draft, assumes_future_salary: e.target.checked })} />
          <span style={{ font: '400 13px Outfit, sans-serif' }}>Supone sueldo futuro</span>
        </label>
      </div>
      <Field label="Descripción">
        <textarea
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', width: '100%' }}
        />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={onSubmit}>
          Guardar
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  border: '1.5px solid var(--color-hairline-input)',
  borderRadius: 12,
  padding: '10px 12px',
  font: '400 14px Outfit, sans-serif',
};

function cumulative(nums: number[]) {
  let acc = 0;
  return nums.map((n) => (acc += n));
}
