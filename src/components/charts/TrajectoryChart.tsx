interface Props {
  realPoints: number[]; // historical progress, 0..1 fraction of target
  requiredPoints: number[]; // required trajectory to hit target on time, 0..1
  height?: number;
}

const W = 420;

export function TrajectoryChart({ realPoints, requiredPoints, height = 110 }: Props) {
  const toY = (v: number) => height - v * (height - 10);
  const stepReal = realPoints.length > 1 ? W / (requiredPoints.length - 1) : 0;
  const stepReq = requiredPoints.length > 1 ? W / (requiredPoints.length - 1) : 0;

  const realPath = realPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * stepReal},${toY(v)}`).join(' ');
  const reqPath = requiredPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * stepReq},${toY(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <line x1={0} y1={10} x2={W} y2={10} stroke="var(--color-hairline)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path d={reqPath} fill="none" stroke="var(--color-hairline-strong)" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
      <path d={realPath} fill="none" stroke="#0F4CD9" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
