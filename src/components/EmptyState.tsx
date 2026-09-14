import type { ReactNode } from 'react';

interface Props {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'positive';
  children?: ReactNode;
}

/** "Ninguno usa ilustración ni signo de exclamación": qué falta, qué pasa al llenarlo, una sola acción. */
export function EmptyState({ title, body, actionLabel, onAction, variant = 'default', children }: Props) {
  return (
    <div
      className="empty-state"
      style={variant === 'positive' ? { background: 'var(--color-green-bg)', padding: '34px 30px' } : undefined}
    >
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={variant === 'positive' ? 'btn btn-ghost' : 'btn btn-primary'}
          style={{ marginTop: 8 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
