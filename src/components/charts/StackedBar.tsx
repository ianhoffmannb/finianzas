interface Segment {
  pct: number; // 0-100
  color: string; // css color, or 'hatch' for the diagonal "variable" texture
  label?: string;
}

export function StackedBar({ segments, height = 10 }: { segments: Segment[]; height?: number }) {
  return (
    <div style={{ display: 'flex', height, width: '100%', overflow: 'hidden', borderRadius: height >= 12 ? 99 : 0 }}>
      {segments.map((s, i) => (
        <div
          key={i}
          style={{
            width: `${s.pct}%`,
            background:
              s.color === 'hatch'
                ? 'repeating-linear-gradient(135deg,#0F4CD9 0 3px,#B9CBF5 3px 6px)'
                : s.color,
          }}
        />
      ))}
    </div>
  );
}

export function StackedBarLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', font: '400 12.5px Outfit, sans-serif', color: 'var(--color-graphite)' }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 9,
              height: 9,
              background:
                it.color === 'hatch' ? 'repeating-linear-gradient(135deg,#0F4CD9 0 3px,#B9CBF5 3px 6px)' : it.color,
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
