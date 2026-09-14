import { useState, type ReactNode } from 'react';
import { MoneyInput } from './MoneyInput';

export type FieldType = 'text' | 'money' | 'day' | 'checkbox' | 'select' | 'date';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

type Draft = Record<string, string | number | boolean>;

interface Props<T extends { id: string }> {
  items: T[];
  fields: FieldDef[];
  emptyDraft: Draft;
  toDraft: (item: T) => Draft;
  renderRow: (item: T, actions: { onEdit: () => void; onDelete: () => void }) => ReactNode;
  onCreate: (draft: Draft) => Promise<{ error: string | null }>;
  onUpdate: (id: string, draft: Draft) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  addLabel: string;
}

export function EditableList<T extends { id: string }>({
  items,
  fields,
  emptyDraft,
  toDraft,
  renderRow,
  onCreate,
  onUpdate,
  onDelete,
  addLabel,
}: Props<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: T) {
    setEditingId(item.id);
    setAdding(false);
    setDraft(toDraft(item));
    setError(null);
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setAdding(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    const result = editingId ? await onUpdate(editingId, draft) : await onCreate(draft);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      cancel();
    }
  }

  function form() {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', padding: '12px 0', borderTop: '1px solid var(--color-hairline)' }}>
        {fields.map((f) => (
          <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: f.type === 'text' ? '1 1 160px' : '0 0 auto' }}>
            <span style={{ font: '400 11.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{f.label}</span>
            {renderField(f, draft, setDraft)}
          </label>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" disabled={saving} onClick={save} style={{ padding: '10px 16px' }}>
            Guardar
          </button>
          <button className="btn btn-ghost" onClick={cancel} style={{ padding: '10px 16px' }}>
            Cancelar
          </button>
        </div>
        {error && <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-red)', flexBasis: '100%' }}>{error}</span>}
      </div>
    );
  }

  return (
    <div className="ledger">
      {items.map((item) => (editingId === item.id ? <div key={item.id}>{form()}</div> : <div key={item.id}>{renderRow(item, { onEdit: () => startEdit(item), onDelete: () => onDelete(item.id) })}</div>))}
      {adding ? (
        form()
      ) : (
        <button
          onClick={startAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 0',
            borderTop: '1px solid var(--color-hairline)',
            background: 'transparent',
            border: 0,
            borderTopStyle: 'solid',
            font: '400 13px Outfit, sans-serif',
            color: 'var(--color-accent)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

function renderField(f: FieldDef, draft: Draft, setDraft: (d: Draft) => void) {
  const value = draft[f.key];
  if (f.type === 'money') {
    return (
      <MoneyInput value={Number(value) || 0} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
    );
  }
  if (f.type === 'day') {
    return (
      <input
        type="number"
        min={1}
        max={31}
        value={String(value ?? '')}
        onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) })}
        style={{ width: 64, border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '9px 10px', font: '400 13px Outfit, sans-serif' }}
      />
    );
  }
  if (f.type === 'date') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
        style={{ border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '9px 10px', font: '400 13px Outfit, sans-serif' }}
      />
    );
  }
  if (f.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
        style={{ width: 18, height: 18 }}
      />
    );
  }
  if (f.type === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
        style={{ border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '9px 10px', font: '400 13px Outfit, sans-serif' }}
      >
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type="text"
      value={String(value ?? '')}
      placeholder={f.placeholder}
      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
      style={{ border: '1.5px solid var(--color-hairline-input)', borderRadius: 10, padding: '9px 10px', font: '400 13px Outfit, sans-serif', minWidth: 140 }}
    />
  );
}
