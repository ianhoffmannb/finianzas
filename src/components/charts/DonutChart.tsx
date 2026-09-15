import { useState } from 'react';
import { formatCLP } from '../../utils/money';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;      // css color o 'hatch' para la trama de variables
  note?: string;
}

interface Props {
  slices: DonutSlice[];
  /** Texto bajo la cifra central cuando no hay nada con hover. */
  centerLabel: string;
  size?: number;
}

const GAP_DEG = 2; // separador de 2px entre segmentos, como pide el sistema

/**
 * Parte-sobre-total de un vistazo (<= 6 segmentos). La identidad nunca está solo
 * en el color: cada porción se lista abajo con su nombre, monto y porcentaje.
 */
export function DonutChart({ slices, centerLabel, size = 220 }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const total = slices.reduce((a, s) => a + Math.max(s.value, 0), 0);
  const visible = slices.filter((s) => s.value > 0);
  const active = visible.find((s) => s.key === hovered) ?? null;

  if (total <= 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '400 13px Outfit, sans-serif',
            color: 'var(--color-graphite)',
            textAlign: 'center',
          }}
        >
          Cuando registres ingresos y gastos del mes, acá se dibuja en qué se va tu plata.
        </div>
      </div>
    );
  }

  const r = size / 2;
  const outer = r - 4;
  const inner = outer * 0.62;
  let cursor = -90; // arranca arriba

  const arcs = visible.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const gap = visible.length > 1 ? Math.min(GAP_DEG, sweep / 3) : 0;
    const start = cursor + gap / 2;
    const end = cursor + sweep - gap / 2;
    cursor += sweep;
    return { slice, d: arcPath(r, r, outer, inner, start, end) };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', alignSelf: 'center', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Distribución: ${centerLabel}`}>
          <defs>
            <pattern id="donut-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
              <rect width="6" height="6" fill="var(--chart-hatch-b)" />
              <rect width="3" height="6" fill="var(--chart-hatch-a)" />
            </pattern>
          </defs>
          {arcs.map(({ slice, d }) => (
            <path
              key={slice.key}
              d={d}
              fill={slice.color === 'hatch' ? 'url(#donut-hatch)' : slice.color}
              stroke="var(--color-surface)"
              strokeWidth={2}
              opacity={hovered && hovered !== slice.key ? 0.45 : 1}
              style={{ transition: 'opacity 0.12s ease', cursor: 'default' }}
              onMouseEnter={() => setHovered(slice.key)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '0 18%',
          }}
        >
          <span style={{ font: '600 22px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {formatCLP(active ? active.value : total)}
          </span>
          <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)', marginTop: 2 }}>
            {active ? active.label : centerLabel}
          </span>
        </div>
      </div>

      <div className="ledger">
        {visible.map((slice) => (
          <div
            key={slice.key}
            className="ledger-row"
            style={{ gap: 10, padding: '9px 0' }}
            onMouseEnter={() => setHovered(slice.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                flex: '0 0 10px',
                borderRadius: 2,
                background:
                  slice.color === 'hatch'
                    ? 'repeating-linear-gradient(135deg,var(--chart-hatch-a) 0 3px,var(--chart-hatch-b) 3px 6px)'
                    : slice.color,
              }}
            />
            <span className="label" style={{ font: '400 13px Outfit, sans-serif' }}>
              {slice.label}
              {slice.note && (
                <span style={{ font: '400 12px Outfit, sans-serif', color: 'var(--color-graphite)' }}> · {slice.note}</span>
              )}
            </span>
            <span style={{ font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)', minWidth: 42, textAlign: 'right' }}>
              {((slice.value / total) * 100).toFixed(0)}%
            </span>
            <span style={{ font: '500 13px Outfit, sans-serif', fontVariantNumeric: 'tabular-nums', minWidth: 90, textAlign: 'right' }}>
              {formatCLP(slice.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outer: number, inner: number, startDeg: number, endDeg: number): string {
  const sweep = endDeg - startDeg;
  // un anillo completo no se puede dibujar con un solo arco: se parte en dos
  if (sweep >= 359.9) {
    const midDeg = startDeg + 180;
    return [arcPath(cx, cy, outer, inner, startDeg, midDeg), arcPath(cx, cy, outer, inner, midDeg, startDeg + 359.9)].join(' ');
  }
  const largeArc = sweep > 180 ? 1 : 0;
  const o1 = polar(cx, cy, outer, startDeg);
  const o2 = polar(cx, cy, outer, endDeg);
  const i2 = polar(cx, cy, inner, endDeg);
  const i1 = polar(cx, cy, inner, startDeg);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}
