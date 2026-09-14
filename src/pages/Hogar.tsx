import { useState } from 'react';
import { useMonth } from '../contexts/MonthContext';
import { useHousehold } from '../hooks/useHousehold';
import { EditableList } from '../components/EditableList';
import { ReceiptDropzone } from '../components/ReceiptDropzone';
import { formatCLP } from '../utils/money';
import { formatMonthYear, addMonths, formatDayMonth } from '../utils/date';
import type { HouseholdExpense } from '../types/models';

const CATEGORY_LABEL: Record<string, string> = {
  supermercado_feria: 'Supermercado y feria',
  parafina_gas: 'Parafina y gas',
  otro: 'Otro',
};

export function Hogar() {
  const { month } = useMonth();
  const household = useHousehold(month);
  const [boletaOpen, setBoletaOpen] = useState(false);

  const monthLabel = formatMonthYear(month);
  const total = household.byCategory;
  const maxCat = Math.max(...[...total.values()], 1);

  const avgMonths = [addMonths(month, -2), addMonths(month, -1), month];

  return (
    <div style={{ background: 'var(--hogar-panel)', width: '100%', maxWidth: 1320, borderRadius: 28, margin: '24px 40px 64px', padding: '34px 34px 40px', display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ border: '1px solid var(--hogar-border)', background: 'repeating-linear-gradient(135deg,#1B1F22 0 8px,#0F1729 8px 16px)', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--hogar-amber)', letterSpacing: '0.02em' }}>Esta plata no es mía</span>
          <span style={{ font: '400 13px/1.5 Outfit, sans-serif', color: 'var(--hogar-muted)', maxWidth: 640, textWrap: 'pretty' }}>
            Administras la plata de la casa. No suma a tu patrimonio, no entra a tu flujo, no aparece en tus estados financieros ni en tus proyecciones. Es una rendición de cuentas, no una cuenta tuya.
          </span>
        </div>
        <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--hogar-muted-2)', border: '1px solid var(--hogar-border)', padding: '8px 12px' }}>Contabilidad separada</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, font: '600 28px Outfit, sans-serif', letterSpacing: '-0.02em', color: 'var(--hogar-ink)' }}>Hogar</h1>
          <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>{monthLabel} · gastos de la casa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setBoletaOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              font: '500 13.5px Outfit, sans-serif',
              background: boletaOpen ? 'var(--hogar-ink)' : 'transparent',
              color: boletaOpen ? '#0B1220' : 'var(--hogar-ink)',
              border: '1.5px solid var(--hogar-ink)',
              padding: '11px 20px',
              borderRadius: 99,
              cursor: 'pointer',
            }}
          >
            <span style={{ width: 13, height: 13, border: '1.5px solid currentColor', borderRadius: 3, display: 'inline-block' }} />
            Adjuntar boleta
          </button>
        </div>
      </div>

      {boletaOpen && (
        <div style={{ border: '1px dashed var(--hogar-border)', borderRadius: 20, padding: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ font: '600 15px Outfit, sans-serif', color: 'var(--hogar-ink)' }}>Boleta de {monthLabel}</span>
            <span style={{ font: '400 13px/1.6 Outfit, sans-serif', color: 'var(--hogar-muted)' }}>
              Arrastra la foto de la boleta o haz clic para buscarla. Queda guardada junto al gasto de la casa.
            </span>
          </div>
          <ReceiptDropzone
            label="Boleta del supermercado"
            month={month}
            onUploaded={(path) => household.expenses.insert({ month, spent_on: month.slice(0, 10), label: 'Boleta supermercado', amount: 0, category: 'supermercado_feria', receipt_path: path } as never)}
          />
          <ReceiptDropzone
            label="Parafina · opcional"
            month={month}
            onUploaded={(path) => household.expenses.insert({ month, spent_on: month.slice(0, 10), label: 'Boleta parafina', amount: 0, category: 'parafina_gas', receipt_path: path } as never)}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20 }}>
        <HogarStat label="Recibido" value={formatCLP(household.incomeRecord?.amount ?? 0)} sub={household.incomeRecord?.received_on ? `el ${formatDayMonth(household.incomeRecord.received_on)}` : 'sin registrar'} />
        <HogarStat label="Gastado" value={formatCLP(household.totalSpent)} sub={household.incomeRecord ? `${((household.totalSpent / (household.incomeRecord.amount || 1)) * 100).toFixed(0)}% del mes` : ''} />
        <HogarStat label="Por rendir" value={formatCLP(household.pending)} sub="saldo en efectivo" amber />
        <HogarStat label="Tu patrimonio" value="sin efecto" sub="$0 de esto es tuyo" dashed />
      </div>

      <IncomeQuickEdit month={month} amount={household.incomeRecord?.amount ?? 0} receivedOn={household.incomeRecord?.received_on ?? ''} onSave={household.setIncome} />

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 }}>
            <span style={{ font: '600 13px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>Gastos de {monthLabel}</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>{household.expenses.rows.length} movimientos</span>
          </div>
          <EditableList
            items={household.expenses.rows}
            addLabel="+ agregar gasto de la casa"
            fields={[
              { key: 'label', label: 'Descripción', type: 'text' },
              { key: 'amount', label: 'Monto', type: 'money' },
              { key: 'spent_on', label: 'Fecha', type: 'date' },
              { key: 'category', label: 'Categoría', type: 'select', options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })) },
            ]}
            emptyDraft={{ label: '', amount: 0, spent_on: month.slice(0, 10), category: 'supermercado_feria', month }}
            toDraft={(i: HouseholdExpense) => ({ label: i.label, amount: i.amount, spent_on: i.spent_on, category: i.category, month: i.month })}
            onCreate={(d) => household.expenses.insert(d as never)}
            onUpdate={(id, d) => household.expenses.update(id, d as never)}
            onDelete={(id) => household.expenses.remove(id)}
            renderRow={(item, a) => (
              <div className="ledger-row" style={{ borderTop: '1px solid var(--hogar-row)' }}>
                <span style={{ font: '500 12px Outfit, sans-serif', color: 'var(--hogar-muted-2)', width: 46 }}>{formatDayMonth(item.spent_on)}</span>
                <span className="label" style={{ color: 'var(--hogar-ink)' }}>{item.label}</span>
                <span className="amount" style={{ color: 'var(--hogar-ink)' }}>{formatCLP(item.amount)}</span>
                <button onClick={a.onEdit} style={ghostBtn}>editar</button>
                <button onClick={a.onDelete} style={ghostBtn}>eliminar</button>
              </div>
            )}
          />
          <div className="ledger-row" style={{ borderTop: '2px solid var(--hogar-ink)', borderBottom: '3px double var(--hogar-ink)', padding: '14px 0' }}>
            <span className="label" style={{ fontWeight: 600, color: 'var(--hogar-ink)' }}>Total rendido</span>
            <span className="amount" style={{ fontWeight: 600, color: 'var(--hogar-ink)' }}>{formatCLP(household.totalSpent)}</span>
          </div>
          <div className="ledger-row" style={{ borderBottom: '1px solid var(--hogar-row)' }}>
            <span className="label" style={{ color: 'var(--hogar-amber)' }}>Saldo por rendir</span>
            <span className="amount" style={{ color: 'var(--hogar-amber)' }}>{formatCLP(household.pending)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ border: '1px solid var(--hogar-border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>Por categoría</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...total.entries()].map(([cat, amount]) => (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ font: '400 13px Outfit, sans-serif', color: 'var(--hogar-ink)' }}>{CATEGORY_LABEL[cat] ?? cat}</span>
                    <span style={{ font: '500 13px Outfit, sans-serif', color: 'var(--hogar-ink)', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(amount)}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--hogar-row)', borderRadius: 99, width: '100%' }}>
                    <div style={{ width: `${(amount / maxCat) * 100}%`, height: 8, background: 'var(--hogar-muted)', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
            <span style={{ font: '400 11px/1.6 Outfit, sans-serif', color: 'var(--hogar-muted-2)', borderTop: '1px solid var(--hogar-row)', paddingTop: 14 }}>
              Sin azul ni verde en esta pantalla: los colores de tu plata no se usan acá.
            </span>
          </div>

          <AverageCard months={avgMonths} current={household.totalSpent} />
        </div>
      </div>
    </div>
  );
}

function IncomeQuickEdit({ month, amount, receivedOn, onSave }: { month: string; amount: number; receivedOn: string; onSave: (amount: number, receivedOn: string) => void }) {
  const [a, setA] = useState(amount);
  const [d, setD] = useState(receivedOn || month.slice(0, 10));
  return (
    <div style={{ border: '1px dashed var(--hogar-border)', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>Monto recibido este mes</span>
        <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} style={hogarInput} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>Fecha</span>
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} style={hogarInput} />
      </label>
      <button className="btn" style={{ background: 'var(--hogar-ink)', color: '#0B1220' }} onClick={() => onSave(a, d)}>
        Guardar
      </button>
    </div>
  );
}

function AverageCard({ months, current }: { months: string[]; current: number }) {
  return (
    <div style={{ border: '1px solid var(--hogar-border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>Mes actual</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="ledger-row" style={{ borderTop: '1px solid var(--hogar-row)', borderBottom: '1px solid var(--hogar-row)' }}>
          <span className="label" style={{ fontWeight: 500, color: 'var(--hogar-ink)' }}>{formatMonthYear(months[months.length - 1])}</span>
          <span style={{ font: '500 13px Outfit, sans-serif', color: 'var(--hogar-ink)', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(current)}</span>
        </div>
      </div>
      <span style={{ font: '400 12px/1.5 Outfit, sans-serif', color: 'var(--hogar-muted)' }}>
        El presupuesto de la casa alcanza justo. Si un mes sobra, se devuelve; no se acumula como ahorro tuyo.
      </span>
    </div>
  );
}

function HogarStat({ label, value, sub, amber, dashed }: { label: string; value: string; sub: string; amber?: boolean; dashed?: boolean }) {
  return (
    <div style={{ border: `1px ${dashed ? 'dashed' : 'solid'} var(--hogar-border)`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: '600 13px Outfit, sans-serif', color: amber ? 'var(--hogar-amber)' : 'var(--hogar-muted-2)' }}>{label}</span>
      <span style={{ font: '500 24px Outfit, sans-serif', color: amber ? 'var(--hogar-amber)' : dashed ? 'var(--hogar-muted-2)' : 'var(--hogar-ink)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--hogar-muted-2)' }}>{sub}</span>
    </div>
  );
}

const ghostBtn = { font: '400 11px Outfit, sans-serif', color: 'var(--hogar-muted-2)', background: 'transparent', border: 0, cursor: 'pointer' };
const hogarInput = { border: '1.5px solid var(--hogar-border)', borderRadius: 10, padding: '9px 10px', font: '400 13px Outfit, sans-serif', background: 'transparent', color: 'var(--hogar-ink)' };
