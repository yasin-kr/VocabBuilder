import { Icon } from './Icon';

export function Pagination({
  page,
  totalPages,
  onChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages < 2) return null;
  const pages = [
    ...new Set(
      [1, page - 1, page, page + 1, totalPages].filter(
        (value) => value >= 1 && value <= totalPages,
      ),
    ),
  ].sort((a, b) => a - b);
  return (
    <nav className="pagination" aria-label="Kelime sayfaları">
      <button aria-label="İlk sayfa" disabled={disabled || page === 1} onClick={() => onChange(1)}>
        <Icon name="chevrons-left" size={16} />
      </button>
      <button
        aria-label="Önceki sayfa"
        disabled={disabled || page === 1}
        onClick={() => onChange(page - 1)}
      >
        <Icon name="chevron-left" size={16} />
      </button>
      {pages.map((value, index) => (
        <span className="pagination-item" key={value}>
          {index > 0 && value - pages[index - 1] > 1 && (
            <span className="pagination-ellipsis">…</span>
          )}
          <button
            disabled={disabled}
            aria-label={`Sayfa ${value}`}
            aria-current={value === page ? 'page' : undefined}
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        </span>
      ))}
      <button
        aria-label="Sonraki sayfa"
        disabled={disabled || page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <Icon name="chevron-right" size={16} />
      </button>
      <button
        aria-label="Son sayfa"
        disabled={disabled || page === totalPages}
        onClick={() => onChange(totalPages)}
      >
        <Icon name="chevrons-right" size={16} />
      </button>
    </nav>
  );
}
