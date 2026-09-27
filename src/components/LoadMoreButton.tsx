import { useState, useEffect, useRef } from 'react';

interface Props {
  page: number;
  totalPages: number;
  onLoadMore: (page: number) => void;
}

export default function LoadMoreButton({ page, totalPages, onLoadMore }: Props) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (totalPages <= 1 || page >= totalPages) return null;

  function handleClick() {
    if (loading || page >= totalPages) return;
    setLoading(true);
    onLoadMore(page + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLoading(false), 400);
  }

  if (!mounted) return <div className="load-more-skeleton" />;

  return (
    <div className="load-more-wrapper">
      <button
        type="button"
        className="btn btn-outline btn-block load-more-btn"
        onClick={handleClick}
        disabled={loading || page >= totalPages}
        aria-label="Load more products"
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" /> Loading…
          </>
        ) : (
          'Load More Products'
        )}
      </button>
    </div>
  );
}