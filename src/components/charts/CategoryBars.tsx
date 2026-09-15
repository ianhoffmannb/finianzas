import { formatCLP } from '../../utils/money';

export interface CategoryRow {
  key: string;
  label: string;
  spent: number;
  cap: number;
}

/**
 * Comparar magnitudes entre categorías es trabajo de barras, no de una torta:
 * un solo tono, ordenadas de mayor a menor, con el tope como marca de referencia.
 */
export function CategoryBars({ rows }: { rows: CategoryRow[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.spent, r.cap)), 1);
  const sorted = [...rows].sort((a, b) => b.spent - a.spent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sorted.map((row) => {
        const over = row.cap > 0 && row.spent > row.cap;
        return (
          <div key={row.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <span style={{ font: '400 13px Outfit, sans-serif' }}>{row.label}</span>
              <span style={{ font: '500 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {formatCLP(row.spent)}
                {row.cap > 0 && (
                  <span style={{ font: '400 12.5px Outfit, sans-serif', color: over ? 'var(--color-amber)' : 'var(--color-graphite)' }}>
                    {' '}/ {formatCLP(row.cap)}
                  </span>
                )}
              </span>
            </div>
            <div style={{ position: 'relative', height: 8, background: 'var(--chart-libre)', borderRadius: 99 }}>
              <div
                style={{
                  width: `${Math.min((row.spent / max) * 100, 100)}%`,
                  height: 8,
                  borderRadius: 99,
                  background: over ? 'var(--chart-capex)' : 'var(--chart-fijos)',
                }}
              />
              {row.cap > 0 && (
                <span
                  aria-hidden
                  title="tope"
                  style={{
                    position: 'absolute',
                    left: `${Math.min((row.cap / max) * 100, 100)}%`,
                    top: -3,
                    width: 2,
                    height: 14,
                    background: 'var(--color-ink)',
                    opacity: 0.45,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
