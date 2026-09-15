import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react';
import { parseCLP } from '../utils/money';

interface Props {
  value: number;
  /** Se dispara con cada tecla. Para estado local del formulario. */
  onChange?: (value: number) => void;
  /** Se dispara al salir del campo o con Enter. Para escribir a la base de datos. */
  onCommit?: (value: number) => void;
  prefix?: string; // "$" | "US$"
  suffix?: string;
  autoFocus?: boolean;
  /** Versión angosta para usar dentro de una fila de ledger. */
  compact?: boolean;
  align?: 'left' | 'right';
}

function display(value: number) {
  return value ? value.toLocaleString('es-CL') : '';
}

/**
 * Único campo de montos de la app: mismo formato con punto de miles, mismo
 * parseo y el mismo comportamiento en todas las pantallas.
 */
export function MoneyInput({ value, onChange, onCommit, prefix = '$', suffix, autoFocus, compact, align }: Props) {
  const [text, setText] = useState(() => display(value));
  const [focused, setFocused] = useState(false);

  // Mientras el campo tiene foco manda lo tecleado; cuando está inactivo sigue
  // al valor del padre, así lo que llega después (un fetch que resuelve) se ve.
  useEffect(() => {
    if (!focused) setText(display(value));
  }, [value, focused]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    onChange?.(parseCLP(e.target.value));
  }

  function commit() {
    setFocused(false);
    const next = parseCLP(text);
    setText(display(next));
    if (onCommit && next !== value) onCommit(next);
  }

  const wrapper: CSSProperties = compact
    ? { padding: '0 10px', borderRadius: 10, maxWidth: 140 }
    : {};
  const input: CSSProperties = {
    ...(compact ? { font: '400 13px Outfit, sans-serif', padding: '8px 6px' } : {}),
    ...(align === 'right' || compact ? { textAlign: 'right' } : {}),
  };

  return (
    <div className="money-input" style={wrapper}>
      <span className="prefix" style={compact ? { font: '400 12.5px Outfit, sans-serif' } : undefined}>
        {prefix}
      </span>
      <input
        inputMode="numeric"
        value={text}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        autoFocus={autoFocus}
        style={input}
      />
      {suffix && <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{suffix}</span>}
    </div>
  );
}
