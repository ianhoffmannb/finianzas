import { useState } from 'react';
import { MoneyInput } from '../components/MoneyInput';
import { useAccounts } from '../hooks/useAccounts';
import { useSavingsAccrual } from '../hooks/useSavingsAccrual';
import { EmptyState } from '../components/EmptyState';
import { Chip } from '../components/Chip';
import { StackedBar } from '../components/charts/StackedBar';
import { formatCLP, formatUSD } from '../utils/money';
import { balanceInClp } from '../utils/accounts';
import type { Account, AccountType, Currency } from '../types/models';

const TYPE_LABEL: Record<AccountType, string> = { liquido: 'Líquido', invertido: 'Invertido', deuda: 'Deuda' };
const TYPE_COLOR: Record<AccountType, string> = { liquido: '#0F4CD9', invertido: '#0F7A58', deuda: '#C23A2B' };

export function Cuentas() {
  const accounts = useAccounts();
  const accrual = useSavingsAccrual();
  const total = accounts.totalLiquido + accounts.totalInvertido;
  const liquidoPct = total ? (accounts.totalLiquido / total) * 100 : 0;
  const invertidoPct = total ? (accounts.totalInvertido / total) * 100 : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1>Cuentas</h1>
          <span className="page-sub">{accounts.rows.length} cuentas · editable</span>
        </div>
      </div>

      {accounts.rows.length === 0 ? (
        <EmptyState
          title="Sin cuentas no hay patrimonio."
          body="Es lo primero que conviene llenar: el patrimonio neto, el balance y las proyecciones se construyen desde acá. Basta el nombre, el tipo y el saldo de hoy."
          actionLabel={undefined}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Chip kind="fijo" label="LÍQUIDO" />
            <span className="chip chip-devida">INVERTIDO</span>
            <span className="chip" style={{ color: 'var(--color-red)', borderColor: 'var(--color-red-soft)' }}>DEUDA</span>
          </div>
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20 }}>
          <div className="card" style={{ padding: '20px 22px', gap: 6 }}>
            <span className="card-label">Líquido</span>
            <span className="card-figure">{formatCLP(accounts.totalLiquido)}</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{liquidoPct.toFixed(0)}% del patrimonio</span>
          </div>
          <div className="card" style={{ padding: '20px 22px', gap: 6 }}>
            <span className="card-label">Invertido</span>
            <span className="card-figure">{formatCLP(accounts.totalInvertido)}</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{invertidoPct.toFixed(0)}% del patrimonio</span>
          </div>
          <div className="card" style={{ padding: '20px 22px', gap: 6 }}>
            <span className="card-label" style={{ color: 'var(--color-green)' }}>Ahorro acumulado</span>
            <span className="card-figure" style={{ color: 'var(--color-green)' }}>{formatCLP(accrual.total)}</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
              {formatCLP(accrual.closed)} cerrado + {formatCLP(accrual.currentCommitment)} de este mes
            </span>
          </div>
          <div className="card" style={{ padding: '20px 22px', gap: 6 }}>
            <span className="card-label" style={{ color: accounts.totalDeuda > 0 ? 'var(--color-red)' : 'var(--color-green)' }}>Deuda</span>
            <span className="card-figure" style={{ color: accounts.totalDeuda > 0 ? 'var(--color-red)' : 'var(--color-green)' }}>{formatCLP(accounts.totalDeuda)}</span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{accounts.totalDeuda > 0 ? 'comprometido a futuro' : 'nada comprometido a futuro'}</span>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {(['liquido', 'invertido', 'deuda'] as AccountType[]).map((type) => {
            const items = accounts.rows.filter((a) => a.type === type);
            return (
              <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{TYPE_LABEL[type]}</span>
                {items.map((a) => (
                  <AccountRow
                    key={a.id}
                    account={a}
                    committed={accrual.committedTo(a.id)}
                    onDelete={() => accounts.remove(a.id)}
                    onSave={(patch) => accounts.update(a.id, patch)}
                  />
                ))}
                {items.length === 0 && type === 'deuda' && (
                  <div className="card" style={{ background: 'var(--color-green-bg)', padding: '34px 30px', alignItems: 'flex-start' }}>
                    <span style={{ font: '600 12.5px Outfit, sans-serif', color: 'var(--color-green)' }}>Sin deudas</span>
                    <span style={{ font: '600 22px Outfit, sans-serif', letterSpacing: '-0.01em' }}>No le debes nada a nadie.</span>
                    <span style={{ font: '400 13px/1.6 Outfit, sans-serif', color: 'var(--color-graphite-2)', maxWidth: 460 }}>
                      Todo tu patrimonio es tuyo. Esta sección existe para cuando aparezca una tarjeta o un crédito — mientras esté vacía, está ganando.
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <AddAccountForm onCreate={(d) => accounts.insert(d as never)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 26 }}>
          <div className="card">
            <span className="card-label">Composición</span>
            <StackedBar height={14} segments={[{ pct: liquidoPct, color: '#0F4CD9' }, { pct: invertidoPct, color: '#0F7A58' }]} />
            <div className="ledger">
              <div className="ledger-row">
                <span style={{ width: 10, height: 10, background: '#0F4CD9', marginRight: 10 }} />
                <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>Líquido</span>
                <span style={{ font: '500 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{liquidoPct.toFixed(0)}%</span>
              </div>
              <div className="ledger-row" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                <span style={{ width: 10, height: 10, background: '#0F7A58', marginRight: 10 }} />
                <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>Invertido</span>
                <span style={{ font: '500 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{invertidoPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <span className="card-label">Tipo de cuenta</span>
            {(['liquido', 'invertido', 'deuda'] as AccountType[]).map((t) => (
              <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 10, height: 10, background: TYPE_COLOR[t], marginTop: 5, flex: '0 0 10px' }} />
                <span style={{ font: '400 12px/1.5 Outfit, sans-serif', color: 'var(--color-graphite-2)' }}>
                  <strong style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{TYPE_LABEL[t]}</strong>{' '}
                  {t === 'liquido' ? '— lo puedes usar esta semana. Alimenta el fondo de emergencia.' : t === 'invertido' ? '— a plazo. Entra a las proyecciones con retorno esperado.' : '— se resta del patrimonio neto y su cuota entra a gastos fijos.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountRow({ account, committed, onDelete, onSave }: { account: Account; committed: number; onDelete: () => void; onSave: (patch: Partial<Account>) => void }) {
  return (
    <div className="card" style={{ padding: '18px 22px', flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <span style={{ width: 10, height: 10, background: TYPE_COLOR[account.type], flex: '0 0 10px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        <span style={{ font: '500 15px Outfit, sans-serif' }}>{account.name}</span>
        <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
          {account.currency === 'USD' ? `${formatUSD(account.current_balance)}` : account.notes ?? ''}
        </span>
        {committed > 0 && (
          <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-green)' }}>
            +{formatCLP(committed)} al mes · se suma solo al cerrar
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        <span style={{ font: '500 17px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{formatCLP(balanceInClp(account))}</span>
        {account.currency === 'USD' && account.fx_rate && (
          <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{formatUSD(account.current_balance)} × ${account.fx_rate}</span>
        )}
      </div>
      <QuickEdit account={account} onSave={onSave} onDelete={onDelete} />
    </div>
  );
}

function QuickEdit({ account, onSave, onDelete }: { account: Account; onSave: (p: Partial<Account>) => void; onDelete: () => void }) {
  return (
    <details>
      <summary className="btn btn-ghost" style={{ padding: '9px 15px', listStyle: 'none', display: 'inline-block' }}>
        Editar
      </summary>
      <div style={{ position: 'absolute', marginTop: 8, background: 'var(--color-bg)', border: '1px solid var(--color-hairline)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 18px 44px #0F172914', zIndex: 5 }}>
        <label style={smallLabel}>
          Saldo
          <MoneyInput
            value={account.current_balance}
            prefix={account.currency === 'USD' ? 'US$' : '$'}
            onCommit={(v) => onSave({ current_balance: v })}
          />
        </label>
        {account.currency === 'USD' && (
          <label style={smallLabel}>
            Dólar observado
            <MoneyInput value={account.fx_rate ?? 0} onCommit={(v) => onSave({ fx_rate: v })} />
          </label>
        )}
        <button
          onClick={() => {
            if (confirm(`¿Eliminar la cuenta "${account.name}"? Se borra también su historial de saldos.`)) onDelete();
          }}
          style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-red)', background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          Eliminar cuenta
        </button>
      </div>
    </details>
  );
}

function AddAccountForm({ onCreate }: { onCreate: (d: Record<string, unknown>) => void }) {
  return (
    <details className="card">
      <summary style={{ cursor: 'pointer', font: '500 13px Outfit, sans-serif', color: 'var(--color-accent)', listStyle: 'none' }}>+ Agregar cuenta</summary>
      <AddAccountFields onCreate={onCreate} />
    </details>
  );
}

function AddAccountFields({ onCreate }: { onCreate: (d: Record<string, unknown>) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('liquido');
  const [currency, setCurrency] = useState<Currency>('CLP');
  const [balance, setBalance] = useState(0);
  const [fxRate, setFxRate] = useState(0);

  function submit() {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      type,
      currency,
      current_balance: balance,
      fx_rate: currency === 'USD' ? fxRate || null : null,
    });
    setName('');
    setBalance(0);
    setFxRate(0);
  }

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'flex-end' }}>
      <label style={smallLabel}>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} style={smallInput} />
      </label>
      <label style={smallLabel}>
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value as AccountType)} style={smallInput}>
          <option value="liquido">Líquido</option>
          <option value="invertido">Invertido</option>
          <option value="deuda">Deuda</option>
        </select>
      </label>
      <label style={smallLabel}>
        Moneda
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} style={smallInput}>
          <option value="CLP">CLP</option>
          <option value="USD">USD</option>
        </select>
      </label>
      <label style={smallLabel}>
        Saldo
        <MoneyInput value={balance} onChange={setBalance} prefix={currency === 'USD' ? 'US$' : '$'} />
      </label>
      {currency === 'USD' && (
        <label style={smallLabel}>
          Dólar observado
          <MoneyInput value={fxRate} onChange={setFxRate} />
        </label>
      )}
      <button type="button" onClick={submit} className="btn btn-primary" style={{ padding: '10px 16px' }}>
        Guardar
      </button>
    </div>
  );
}

const smallLabel = { display: 'flex', flexDirection: 'column' as const, gap: 4, font: '400 11.5px Outfit, sans-serif', color: 'var(--color-graphite)' };
const smallInput = { border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '9px 10px', font: '400 13px Outfit, sans-serif' };
