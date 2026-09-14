interface Props {
  points: { label: string; value: number; highlight?: boolean }[];
  height?: number;
}

export function EvolutionBars({ points, height = 160 }: Props) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const w = 700;
  const gap = 30;
  const barW = points.length ? (w - gap * (points.length - 1)) / points.length : 0;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <line x1={0} y1={height - 10} x2={w} y2={height - 10} stroke="var(--color-hairline-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => {
        const barH = Math.max((p.value / max) * (height - 20), 2);
        const x = i * (barW + gap);
        const y = height - 10 - barH;
        return <rect key={i} x={x} y={y} width={barW} height={barH} fill={p.highlight ? '#0F4CD9' : '#B9CBF5'} />;
      })}
    </svg>
  );
}
