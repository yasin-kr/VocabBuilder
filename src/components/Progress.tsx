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
      {!training && (
        <span className="progress-number" aria-hidden="true">
          {Math.round(percentage)}%
        </span>
      )}
      <progress
        className="sr-only"
        value={percentage}
        max={100}
        aria-label={training ? 'Alıştırma ilerlemesi' : 'Kelime öğrenme ilerlemesi'}
      >
        {label}
      </progress>
      <span
        className="progress-ring"
        style={{ '--progress': `${percentage}%` } as CSSProperties}
        aria-hidden="true"
      >
        <span>{label}</span>
      </span>
    </span>
  );
}
