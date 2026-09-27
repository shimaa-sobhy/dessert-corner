interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button type="button" onClick={() => onChange(page === 1 ? totalPages : page - 1)} aria-label="Previous page">
        ‹
      </button>
      {pages.map((p) => (
        <button key={p} type="button" className={p === page ? 'active' : ''} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page === totalPages ? 1 : page + 1)} aria-label="Next page">
        ›
      </button>
    </div>
  );
}
