import { useEffect, useState, type ChangeEvent } from 'react';
import { parseCLP } from '../utils/money';

interface Props {
  value: number;
  onChange: (value: number) => void;
  prefix?: string; // "$" | "US$"
  suffix?: string; // "CLP" | equivalence text
  autoFocus?: boolean;
}

function display(value: number) {
  return value ? value.toLocaleString('es-CL') : '';
}

export function MoneyInput({ value, onChange, prefix = '$', suffix, autoFocus }: Props) {
  const [text, setText] = useState(() => display(value));
  const [focused, setFocused] = useState(false);

  // While the field has focus the typed text wins; once it's idle it follows
  // whatever the parent holds, so values arriving later (a fetch resolving)
  // actually show up instead of leaving a stale zero on screen.
  useEffect(() => {
    if (!focused) setText(display(value));
  }, [value, focused]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    onChange(parseCLP(e.target.value));
  }

  return (
    <div className="money-input">
      <span className="prefix">{prefix}</span>
      <input
        inputMode="numeric"
        value={text}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
      />
      {suffix && <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>{suffix}</span>}
    </div>
  );
}
