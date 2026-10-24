import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { categoryLabel } from '../lib/locale';

interface DashboardProps {
  categories: readonly string[];
  search: string;
  category: string;
  irregular: boolean;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onIrregularChange: (value: boolean) => void;
  onAddWord?: () => void;
}

export function Dashboard({
  categories,
  search,
  category,
  irregular,
  totalCount,
  onSearchChange,
  onCategoryChange,
  onIrregularChange,
  onAddWord,
}: DashboardProps) {
  return (
    <section className="dashboard" aria-label="Kelime arayın ve öğrenme sürecinizi yönetin">
      <div className="filters">
        <div className="search-field">
          <label className="sr-only" htmlFor="word-search">
            Kelime ara
          </label>
          <input
            id="word-search"
            type="search"
            placeholder="Kelime ara"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
          />
          <Icon name="search" size={22} />
        </div>
        <div className="filter-category">
          <div className="select-wrap">
            <label className="sr-only" htmlFor="category-filter">
              Kategoriler
            </label>
            <select
              id="category-filter"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">Kategoriler</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item)}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={20} />
          </div>
          {category === 'verb' && (
            <fieldset className="verb-options">
              <legend className="sr-only">Fiil türüne göre filtrele</legend>
              <label>
                <input
                  type="radio"
                  checked={!irregular}
                  onChange={() => onIrregularChange(false)}
                  name="filter-verb"
                />
                Düzenli
              </label>
              <label>
                <input
                  type="radio"
                  checked={irregular}
                  onChange={() => onIrregularChange(true)}
                  name="filter-verb"
                />
                Düzensiz
              </label>
            </fieldset>
          )}
        </div>
      </div>
      <div className="dashboard-tools">
        <p className="statistics">
          Öğrenilecek: <strong>{totalCount}</strong>
        </p>
        <div className="dashboard-actions">
          {onAddWord && (
            <button type="button" className="text-button" onClick={onAddWord}>
              Kelime ekle <Icon name="plus" size={20} />
            </button>
          )}
          <Link className="text-button" to="/training">
            Alıştırma yap <Icon name="arrow-right" size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
