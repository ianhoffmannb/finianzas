interface Props {
  points: number[]; // values, oldest to newest
  height?: number;
  color?: string;
}

const W = 700;

export function AreaSparkline({ points, height = 150, color = '#0F4CD9' }: Props) {
  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', color: 'var(--color-graphite)', font: '400 13px Outfit' }}>
        Aún no hay suficiente historial para el gráfico.
      </div>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = W / (points.length - 1);
  const toY = (v: number) => height - 22 - ((v - min) / range) * (height - 40);

  const coords = points.map((v, i) => [i * step, toY(v)] as const);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${W},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} y1={height * f} x2={W} y2={height * f} stroke="var(--color-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      <path d={areaPath} fill={color} fillOpacity={0.07} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={3.5} fill={color} />
    </svg>
  );
}
