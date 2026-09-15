import { useState } from 'react';
import { usePlannedFlows } from '../hooks/usePlannedFlows';
import { useAccounts } from '../hooks/useAccounts';
import { MoneyInput } from './MoneyInput';
import { EmptyState } from './EmptyState';
import { formatCLP, formatSignedCLP } from '../utils/money';
import { formatMonthYear, addMonths, currentMonthKey } from '../utils/date';
import type { PlannedFlowKind } from '../types/models';

const HORIZON = 12;

/**
 * Caja proyectada: parte del líquido de hoy, suma el flujo típico del mes y
 * aplica los montos que programaste. Sirve para ver si un gasto futuro cabe.
 */
export function PlannedFlows({ monthlyFcl }: { monthlyFcl: number }) {
  const planned = usePlannedFlows();
  const accounts = useAccounts();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<PlannedFlowKind>('gasto');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [monthsAhead, setMonthsAhead] = useState(2);

  const start = currentMonthKey();
  const months = Array.from({ length: HORIZON }, (_, i) => addMonths(start, i));

  let running = accounts.totalLiquido;
  const projection = months.map((m, i) => {
    const net = planned.netFor(m);
    // El mes en curso ya ocurrió en su mayor parte: el flujo típico entra desde el siguiente.
    running += (i === 0 ? 0 : monthlyFcl) + net;
    return { month: m, net, balance: running, items: planned.forMonth(m).filter((f) => f.status === 'pendiente') };
  });

  const lowest = projection.reduce((min, p) => (p.balance < min.balance ? p : min), projection[0]);

  async function submit() {
    if (!label.trim() || amount <= 0) return;
    await planned.insert({
      kind,
      label: label.trim(),
      amount,
      month: addMonths(start, monthsAhead),
      status: 'pendiente',
    } as never);
    setLabel('');
    setAmount(0);
    setAdding(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ font: 'var(--fs-section)' }}>Caja proyectada</span>
        <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
          parte de {formatCLP(accounts.totalLiquido)} líquidos · {formatSignedCLP(monthlyFcl)} al mes
        </span>
      </div>

      {lowest && lowest.balance < 0 && (
        <div className="card" style={{ background: 'var(--color-amber-bg)', gap: 6 }}>
          <span className="card-label" style={{ color: 'var(--color-amber)' }}>La caja se te va a negativo</span>
          <span style={{ font: '400 13px/1.5 Outfit, sans-serif' }}>
            En {formatMonthYear(lowest.month)} quedarías en {formatCLP(lowest.balance)}. Mueve algún gasto programado o sube el flujo libre antes de esa fecha.
          </span>
        </div>
      )}

      <div className="table-scroll">
        <div className="ledger" style={{ minWidth: 520 }}>
          <div className="ledger-row" style={{ borderTop: 'none', borderBottom: '1px solid var(--color-hairline-strong)' }}>
            <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', flex: 1 }}>Mes</span>
            <span style={headCell}>Programado</span>
            <span style={headCell}>Caja al cierre</span>
          </div>
          {projection.map((p) => (
            <div key={p.month} className="ledger-row">
              <span className="label">
                {formatMonthYear(p.month)}
                {p.items.length > 0 && (
                  <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
                    {' '}· {p.items.map((i) => i.label).join(', ')}
                  </span>
                )}
              </span>
              <span style={{ ...bodyCell, color: p.net === 0 ? 'var(--color-graphite)' : p.net > 0 ? 'var(--color-green)' : 'var(--color-amber)' }}>
                {p.net === 0 ? '—' : formatSignedCLP(p.net)}
              </span>
              <span style={{ ...bodyCell, fontWeight: 500, color: p.balance < 0 ? 'var(--color-red)' : 'var(--color-ink)' }}>
                {formatCLP(p.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>Programados</span>
        {planned.pending.length === 0 && !adding && (
          <EmptyState
            title="Nada programado todavía."
            body="Anota un gasto o un ingreso que ya sabes que viene — el seguro en dos meses, una pega puntual — y la caja de arriba lo toma en cuenta."
            actionLabel="Programar movimiento"
            onAction={() => setAdding(true)}
          />
        )}
        {planned.pending.length > 0 && (
          <div className="ledger">
            {planned.pending.map((f) => (
              <div key={f.id} className="ledger-row">
                <span style={{ font: '500 12px Outfit, sans-serif', color: 'var(--color-graphite)', width: 70 }}>{formatMonthYear(f.month)}</span>
                <span className="label">{f.label}</span>
                <span className="amount" style={{ color: f.kind === 'ingreso' ? 'var(--color-green)' : 'var(--color-ink)' }}>
                  {f.kind === 'ingreso' ? '+' : '−'}
                  {formatCLP(f.amount)}
                </span>
                <button onClick={() => planned.update(f.id, { status: 'confirmado' } as never)} style={miniBtn} title="Ya ocurrió">
                  cumplido
                </button>
                <button onClick={() => planned.remove(f.id)} style={miniBtn}>
                  eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {adding ? (
          <div className="card" style={{ gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={fieldLabel}>
                Tipo
                <select value={kind} onChange={(e) => setKind(e.target.value as PlannedFlowKind)} style={selectStyle}>
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </label>
              <label style={{ ...fieldLabel, flex: '1 1 180px' }}>
                Descripción
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Seguro del auto"
                  style={{ ...selectStyle, width: '100%' }}
                />
              </label>
              <label style={fieldLabel}>
                Monto
                <MoneyInput value={amount} onChange={setAmount} />
              </label>
              <label style={fieldLabel}>
                ¿En cuántos meses?
                <select value={monthsAhead} onChange={(e) => setMonthsAhead(Number(e.target.value))} style={selectStyle}>
                  {Array.from({ length: HORIZON }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'este mes' : i === 1 ? 'el próximo' : `en ${i} meses`} · {formatMonthYear(addMonths(start, i))}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={submit}>
                Programar
              </button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          planned.pending.length > 0 && (
            <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding(true)}>
              + Programar movimiento
            </button>
          )
        )}
      </div>
    </div>
  );
}

const headCell = { font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 120, textAlign: 'right' as const };
const bodyCell = { font: '400 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' as const, minWidth: 120, textAlign: 'right' as const };
const miniBtn = { font: '400 11px Outfit, sans-serif', color: 'var(--color-graphite)', background: 'transparent', border: 0, cursor: 'pointer' };
const fieldLabel = { display: 'flex', flexDirection: 'column' as const, gap: 5, font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' };
const selectStyle = { border: '1.5px solid var(--color-hairline-input)', borderRadius: 12, padding: '10px 12px', font: '400 13px Outfit, sans-serif' };
