import type { CSSProperties } from 'react';

export function Progress({
  value,
  label,
  training = false,
}: {
  value: number;
  label?: string;
  training?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, value));
  return (
    <span className={`progress ${training ? 'progress-training' : ''}`}>
      {!training && <span className="progress-number">{Math.round(percentage)}%</span>}
      <span
        className="progress-ring"
        style={{ '--progress': `${percentage}%` } as CSSProperties}
        role="progressbar"
        aria-label={training ? 'Alıştırma ilerlemesi' : 'Kelime öğrenme ilerlemesi'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
      >
        <span>{label}</span>
      </span>
    </span>
  );
}
