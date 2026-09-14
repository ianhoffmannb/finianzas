interface Series {
  base: number[];
  conservador: number[];
  optimista: number[];
}

interface Props {
  series: Series;
  years: string[];
  milestoneIndex?: number; // fractional position 0..years.length-1
  height?: number;
}

const W = 700;

export function ProjectionChart({ series, years, milestoneIndex, height = 250 }: Props) {
  const all = [...series.base, ...series.conservador, ...series.optimista];
  const max = Math.max(...all, 1);
  const n = years.length;
  const step = n > 1 ? W / (n - 1) : W;
  const toY = (v: number) => height - 10 - (v / max) * (height - 20);
  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * step},${toY(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={0}
          y1={height * f}
          x2={W}
          y2={height * f}
          stroke={f === 1 ? 'var(--color-hairline-strong)' : 'var(--color-hairline)'}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {milestoneIndex !== undefined && (
        <line
          x1={milestoneIndex * step}
          y1={0}
          x2={milestoneIndex * step}
          y2={height}
          stroke="var(--color-amber)"
          strokeWidth={1}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path d={path(series.optimista)} fill="none" stroke="#0F4CD9" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
      <path d={path(series.base)} fill="none" stroke="#0F4CD9" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      <path d={path(series.conservador)} fill="none" stroke="#6B7787" strokeWidth={2} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
