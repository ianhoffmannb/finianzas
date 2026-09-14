import { useState, type ChangeEvent } from 'react';
import { parseCLP } from '../utils/money';

interface Props {
  value: number;
  onChange: (value: number) => void;
  prefix?: string; // "$" | "US$"
  suffix?: string; // "CLP" | equivalence text
  autoFocus?: boolean;
}

export function MoneyInput({ value, onChange, prefix = '$', suffix, autoFocus }: Props) {
  const [text, setText] = useState(value ? value.toLocaleString('es-CL') : '');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setText(raw);
    onChange(parseCLP(raw));
  }

  function handleBlur() {
    setText(value ? value.toLocaleString('es-CL') : '0');
  }

  return (
    <div className="money-input">
      <span className="prefix">{prefix}</span>
      <input
        inputMode="numeric"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus={autoFocus}
      />
      {suffix && <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{suffix}</span>}
    </div>
  );
}
