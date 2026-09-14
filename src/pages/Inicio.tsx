import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMonth } from '../contexts/MonthContext';
import { useAccounts } from '../hooks/useAccounts';
import { useNetWorthHistory } from '../hooks/useAccountSnapshots';
import { useIncomeItems } from '../hooks/useIncomeItems';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useVariableActual } from '../hooks/useVariableActual';
import { useSavingsCommitments } from '../hooks/useSavingsCommitments';
import { useCapexItems } from '../hooks/useCapexItems';
import { useReminders, useReminderCompletion } from '../hooks/useReminders';
import { useGoals, requiredMonthly, progressPct } from '../hooks/useGoals';
import { useCollection } from '../hooks/useCollection';
import type { MonthClose } from '../types/models';
import { AreaSparkline } from '../components/charts/AreaSparkline';
import { StackedBar, StackedBarLegend } from '../components/charts/StackedBar';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyState } from '../components/EmptyState';
import { formatCLP, formatPercent, formatSignedCLP } from '../utils/money';
import { formatDayMonth, formatMonthYear, shortMonthLabel, daysUntil } from '../utils/date';
import { useCierre } from '../contexts/CierreContext';

export function Inicio() {
  const { user } = useAuth();
  const { month, isCurrentMonth } = useMonth();
  const cierre = useCierre();
  const navigate = useNavigate();

  const accounts = useAccounts();
  const history = useNetWorthHistory(6);
  const income = useIncomeItems();
  const fixed = useFixedExpenses();
  const variableActual = useVariableActual(month);
  const savings = useSavingsCommitments();
  const capex = useCapexItems(month);
  const reminders = useReminders();
  const reminder = reminders.rows[0];
  const completion = useReminderCompletion(reminder?.id, month);
  const goals = useGoals();
  const closedMonths = useCollection<MonthClose>('month_closes', [{ column: 'status', value: 'closed' }]);

  const displayName = capitalize(user?.email?.split('@')[0] ?? 'ahí');

  const gastos = fixed.total + variableActual.amount;
  const libre = income.total - gastos - savings.total - capex.total;
  const prevTotal = history.history.length > 1 ? history.history[history.history.length - 2].total : null;
  const delta = prevTotal !== null ? accounts.netWorth - prevTotal : null;

  const today = new Date();
  const dayOfMonth = today.getDate();

  const upcoming = [...fixed.rows]
    .sort((a, b) => a.due_day - b.due_day)
    .map((f) => {
      const dateStr = `${month.slice(0, 7)}-${String(f.due_day).padStart(2, '0')}`;
      const days = daysUntil(dateStr);
      let status: 'pagado' | 'hoy' | 'proximo' = 'proximo';
      if (isCurrentMonth) {
        if (days < 0) status = 'pagado';
        else if (days === 0) status = 'hoy';
      }
      return { ...f, dateStr, days, status };
    });

  const nearestGoals = [...goals.rows]
    .filter((g) => g.target_date)
    .sort((a, b) => (a.target_date! < b.target_date! ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', padding: '22px 0 26px', textAlign: 'center' }}>
        <h1 style={{ font: 'var(--fs-hero)', letterSpacing: '-0.025em' }}>Hola, {displayName}</h1>
        <span style={{ font: '400 17px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
          Llevas {closedMonths.rows.length} {closedMonths.rows.length === 1 ? 'mes' : 'meses'} cerrando tus números
        </span>
        {isCurrentMonth && (
          <span
            style={{
              font: '500 13.5px Outfit, sans-serif',
              color: 'var(--color-amber)',
              background: 'var(--color-amber-bg)',
              padding: '9px 18px',
              borderRadius: 99,
              whiteSpace: 'nowrap',
              marginTop: 4,
            }}
          >
            {capitalize(formatMonthYear(month))} sigue abierto · día {dayOfMonth}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 26, borderBottom: '1px solid var(--color-hairline)', marginBottom: 4, flexWrap: 'wrap' }}>
        {[
          { to: '/', label: 'Inicio' },
          { to: '/mes', label: 'Mes' },
          { to: '/metas', label: 'Metas' },
          { to: '/cuentas', label: 'Cuentas' },
          { to: '/hogar', label: 'Hogar' },
        ].map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            style={({ isActive }) => ({
              font: `${isActive ? 600 : 400} 16px Outfit, sans-serif`,
              color: isActive ? '#0F4CD9' : 'var(--color-graphite)',
              padding: '0 2px 14px',
              borderBottom: isActive ? '2.5px solid #0F4CD9' : 'none',
              marginBottom: '-1px',
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)' }}>
        <div className="card" style={{ padding: '26px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="card-label">Patrimonio neto</span>
              <span style={{ font: 'var(--fs-figure-xl)', letterSpacing: '-0.03em' }}>{formatCLP(accounts.netWorth)}</span>
              {delta !== null && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ font: '500 14px Outfit, sans-serif', color: 'var(--color-green)' }}>{formatSignedCLP(delta)}</span>
                  {prevTotal ? (
                    <span style={{ font: '400 14px Outfit, sans-serif', color: 'var(--color-green)' }}>
                      {formatPercent((delta / Math.abs(prevTotal || 1)) * 100, 1)}
                    </span>
                  ) : null}
                  <span style={{ font: '400 14px Outfit, sans-serif', color: 'var(--color-graphite)' }}>vs mes anterior</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 28, paddingTop: 6 }}>
              <Stat label="Líquido" value={formatCLP(accounts.totalLiquido)} />
              <Stat label="Invertido" value={formatCLP(accounts.totalInvertido)} />
              <Stat label="Deuda" value={formatCLP(accounts.totalDeuda)} color={accounts.totalDeuda > 0 ? 'var(--color-red)' : 'var(--color-green)'} />
            </div>
          </div>
          <AreaSparkline points={history.history.map((h) => h.total)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
            {history.history.map((h, i) => (
              <span key={h.month}>
                {shortMonthLabel(h.month)}
                {i === 0 || i === history.history.length - 1 ? ` ${formatCLP(h.total)}` : ''}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <span className="card-label">Flujo del mes</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
              <Stat label="Entra" value={formatCLP(income.total)} big />
              <Stat label="Sale" value={formatCLP(gastos)} big />
              <Stat label="Queda" value={formatCLP(libre)} big color="var(--color-green)" />
            </div>
            <StackedBar
              segments={[
                { pct: pct(fixed.total, income.total), color: '#0F4CD9' },
                { pct: pct(variableActual.amount, income.total), color: 'hatch' },
                { pct: pct(savings.total, income.total), color: 'var(--color-green)' },
                { pct: pct(capex.total, income.total), color: 'var(--color-amber)' },
                { pct: Math.max(100 - pct(gastos + savings.total + capex.total, income.total), 0), color: 'var(--color-hairline)' },
              ]}
            />
            <StackedBarLegend
              items={[
                { color: '#0F4CD9', label: 'fijos' },
                { color: 'hatch', label: 'variables' },
                { color: 'var(--color-green)', label: 'ahorro' },
                { color: 'var(--color-amber)', label: 'capex' },
                { color: 'var(--color-hairline)', label: 'libre' },
              ]}
            />
          </div>

          {reminder ? (
            !completion.done && (
              <div className="card" style={{ background: 'var(--color-amber-bg)' }}>
                <span className="card-label" style={{ color: 'var(--color-amber)' }}>
                  Día {reminder.day_of_month} · {reminder.title}
                </span>
                <span style={{ font: '400 14px/1.55 Outfit, sans-serif', textWrap: 'pretty' }}>{reminder.body}</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn btn-dark" onClick={() => completion.markDone()}>
                    Marcar hecho
                  </button>
                  <button className="btn btn-ghost" onClick={() => reminders.remove(reminder.id)}>
                    Quitar recordatorio
                  </button>
                </div>
              </div>
            )
          ) : (
            <ReminderSetup
              defaultBody={`Separar antes de gastar: ${formatCLP(savings.total)} de ahorro y ${formatCLP(fixed.total)} de fijos. El orden importa más que el monto.`}
              onCreate={(day, body) => reminders.insert({ day_of_month: day, title: 'Llega la mesada', body, active: true } as never)}
            />
          )}
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: 'var(--fs-section)' }}>Próximos vencimientos</span>
            <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{formatCLP(fixed.total)} / mes</span>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Sin gastos fijos aún" body="Agrega tus gastos fijos en la vista Mes para verlos ordenados por día de cobro aquí." />
          ) : (
            <div className="ledger">
              {upcoming.map((u) => (
                <div key={u.id} className="ledger-row" style={u.status === 'hoy' ? { background: 'var(--color-amber-bg)' } : undefined}>
                  <span style={{ font: '500 13px Outfit, sans-serif', color: u.status === 'hoy' ? 'var(--color-amber)' : 'var(--color-graphite)', width: 44 }}>
                    {formatDayMonth(u.dateStr)}
                  </span>
                  <span className="label">{u.name}</span>
                  <span style={{ font: '400 12.5px Outfit, sans-serif', color: u.status === 'hoy' ? 'var(--color-amber)' : 'var(--color-green)' }}>
                    {u.status === 'pagado' ? 'pagado' : u.status === 'hoy' ? 'hoy' : `en ${u.days} días`}
                  </span>
                  <span className="amount">{formatCLP(u.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: 'var(--fs-section)' }}>Metas más cercanas</span>
            <NavLink to="/metas" style={{ font: '400 12px Outfit, sans-serif' }}>
              Ver todas
            </NavLink>
          </div>
          {nearestGoals.length === 0 ? (
            <EmptyState title="Todavía no hay metas" body="Una meta necesita monto, fecha y por qué la quieres." actionLabel="Crear la primera meta" onAction={() => navigate('/metas')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
              {nearestGoals.map((g) => (
                <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ font: '400 14px Outfit, sans-serif' }}>{g.name}</span>
                    <span style={{ font: '500 13px Outfit, sans-serif' }}>
                      {formatCLP(g.current_amount)} <span style={{ color: 'var(--color-graphite)' }}>/ {formatCLP(g.target_amount)}</span>
                    </span>
                  </div>
                  <ProgressBar pct={progressPct(g)} assumed={g.assumes_future_salary} color={g.category === 'de_vida' ? 'green' : 'blue'} />
                  <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                    {formatPercent(progressPct(g))} · requiere {formatCLP(requiredMonthly(g))}/mes
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--color-hairline-strong)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Compromiso mensual de todas las metas</span>
                <span style={{ font: '500 13px Outfit, sans-serif', color: goals.monthlyRequired > libre ? 'var(--color-amber)' : 'var(--color-green)' }}>
                  {formatCLP(goals.monthlyRequired)} vs {formatCLP(libre)} libres
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!accounts.rows.length && (
        <EmptyState
          title="Sin cuentas no hay patrimonio"
          body="Agrega tu primera cuenta para que el patrimonio neto, el balance y las proyecciones empiecen a construirse."
          actionLabel="Agregar primera cuenta"
          onAction={() => navigate('/cuentas')}
        />
      )}

      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={cierre.open}>
        Cerrar {formatMonthYear(month)}
      </button>
    </div>
  );
}

/** El recordatorio mensual del día de la mesada: se crea desde acá. */
function ReminderSetup({ defaultBody, onCreate }: { defaultBody: string; onCreate: (day: number, body: string) => void }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(7);
  const [body, setBody] = useState(defaultBody);

  if (!open) {
    return (
      <button
        onClick={() => {
          setBody(defaultBody);
          setOpen(true);
        }}
        className="card"
        style={{ alignItems: 'flex-start', gap: 6, cursor: 'pointer', border: 0, textAlign: 'left' }}
      >
        <span className="card-label">Recordatorio mensual</span>
        <span style={{ font: '400 13.5px/1.5 Outfit, sans-serif', color: 'var(--color-graphite-2)' }}>
          Avisarte el día que llega la mesada para separar ahorro y fijos antes de gastar.
        </span>
        <span style={{ font: '500 13px Outfit, sans-serif', color: 'var(--color-accent)', marginTop: 4 }}>Crear recordatorio</span>
      </button>
    );
  }

  return (
    <div className="card" style={{ gap: 12 }}>
      <span className="card-label">Recordatorio mensual</span>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ font: '400 13px Outfit, sans-serif' }}>Día del mes</span>
        <input
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          style={{ width: 70, border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '8px 10px', font: '400 13px Outfit, sans-serif' }}
        />
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        style={{ border: '1.5px solid var(--color-hairline-input)', borderRadius: 12, padding: '10px 12px', font: '400 13px Outfit, sans-serif', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            onCreate(day, body);
            setOpen(false);
          }}
        >
          Guardar
        </button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ font: `400 ${big ? '12px' : '12.5px'} Outfit, sans-serif`, color: 'var(--color-graphite)' }}>{label}</span>
      <span style={{ font: `${big ? '500 20px' : '500 16px'} Outfit, sans-serif`, color: color ?? 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.max(Math.min((part / total) * 100, 100), 0);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
