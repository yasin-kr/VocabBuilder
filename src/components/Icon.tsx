export function Icon({
  name,
  size = 24,
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
