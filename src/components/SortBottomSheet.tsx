import type { SortOption } from './SortDropdown';

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SortBottomSheet({ value, onChange, isOpen, onClose }: Props) {
  const OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'popular', label: 'Most Popular' },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="bottom-sheet-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sort options"
    >
      <div className="bottom-sheet sort-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <header className="bottom-sheet-header">
          <h2 className="bottom-sheet-title">Sort By</h2>
          <button
            type="button"
            className="bottom-sheet-close"
            onClick={onClose}
            aria-label="Close sort"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="bottom-sheet-content sort-list">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`sort-option${value === o.value ? ' active' : ''}`}
              onClick={() => {
                onChange(o.value);
                onClose();
              }}
            >
              {o.label}
              {value === o.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}