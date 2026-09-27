import { useEffect, useRef } from 'react';
import { type ShopFilters } from './FilterSidebar';
import { CATEGORIES } from '../data/categories';

interface Props {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  onClear: () => void;
  priceCeiling: number;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function FilterBottomSheet({
  filters,
  onChange,
  onClear,
  priceCeiling,
  isOpen,
  onClose,
  onApply,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!sheetRef.current) return;
    const y = e.touches[0].clientY;
    const diff = y - startY.current;
    if (diff > 0 && sheetRef.current.scrollTop === 0) {
      // Allow swipe down to close
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!sheetRef.current) return;
    const y = e.changedTouches[0].clientY;
    const diff = y - startY.current;
    if (diff > 100) {
      onClose();
    }
  }

  function toggleCategory(slug: string) {
    const has = filters.categories.includes(slug);
    onChange({
      ...filters,
      categories: has ? filters.categories.filter((c: string) => c !== slug) : [...filters.categories, slug],
    });
  }

  if (!isOpen) return null;

  return (
    <div
      className="bottom-sheet-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-sheet-title"
    >
      <div
        ref={sheetRef}
        className="bottom-sheet filter-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bottom-sheet-handle" />
        <header className="bottom-sheet-header">
          <h2 id="filter-sheet-title" className="bottom-sheet-title">Filters</h2>
          <button
            type="button"
            className="bottom-sheet-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="bottom-sheet-content">
          <div className="filter-block">
            <h4>Category</h4>
            {CATEGORIES.map((cat) => (
              <label className="filter-option" key={cat.slug}>
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                />
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
        </div>
        <footer className="bottom-sheet-footer">
          <button type="button" className="clear-all-link" onClick={onClear}>
            Clear All
          </button>
          <button type="button" className="btn btn-primary btn-block" onClick={onApply}>
            Apply Filters
          </button>
        </footer>
      </div>
    </div>
  );
}