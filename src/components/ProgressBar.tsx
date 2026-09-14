interface Props {
  pct: number; // 0-100
  assumed?: boolean; // supuesto futuro -> punteado
  color?: 'blue' | 'green';
  height?: number;
}

export function ProgressBar({ pct, assumed = false, color = 'blue', height = 8 }: Props) {
  return (
    <div className={`progress-track${assumed ? ' assumed' : ''}`} style={{ height }}>
      {!assumed && (
        <div
          className={`progress-fill${color === 'green' ? ' green' : ''}`}
          style={{ width: `${Math.max(Math.min(pct, 100), 1.5)}%`, height }}
        />
      )}
    </div>
  );
}
