export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'best-selling' | 'popular';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'popular', label: 'Most Popular' },
];

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Sort products"
      style={{
        border: '1.5px solid var(--line)',
        borderRadius: 999,
        padding: '10px 18px',
        fontFamily: 'Karla, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink)',
        background: 'var(--white)',
        cursor: 'pointer',
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          Sort: {o.label}
        </option>
      ))}
    </select>
  );
}
