import { CATEGORIES } from '../data/categories';

export interface ShopFilters {
  categories: string[];
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
}

interface Props {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  priceCeiling: number;
}

export default function FilterSidebar({ filters, onChange, priceCeiling }: Props) {
  function toggleCategory(slug: string) {
    const has = filters.categories.includes(slug);
    onChange({
      ...filters,
      categories: has ? filters.categories.filter((c) => c !== slug) : [...filters.categories, slug],
    });
  }

  return (
    <aside>
      <div className="filter-block">
        <h4>Category</h4>
        {CATEGORIES.map((cat) => (
          <label className="filter-option" key={cat.slug}>
            <input type="checkbox" checked={filters.categories.includes(cat.slug)} onChange={() => toggleCategory(cat.slug)} />
            {cat.name}
          </label>
        ))}
      </div>

      <div className="filter-block">
        <h4>Max Price: ${filters.maxPrice.toFixed(0)}</h4>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={1}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--accent-deep)' }}
        />
      </div>

      <div className="filter-block">
        <h4>Minimum Rating</h4>
        {[0, 4, 4.5, 4.8].map((r) => (
          <label className="filter-option" key={r}>
            <input
              type="radio"
              name="min-rating"
              checked={filters.minRating === r}
              onChange={() => onChange({ ...filters, minRating: r })}
            />
            {r === 0 ? 'Any rating' : `${r}+ stars`}
          </label>
        ))}
      </div>

      <div className="filter-block">
        <h4>Availability</h4>
        <label className="filter-option">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
          />
          In stock only
        </label>
      </div>
    </aside>
  );
}
