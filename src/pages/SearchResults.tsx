import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { PRODUCTS } from '../data/products';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const [draft, setDraft] = useState(q);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase().slice(0, 60);
    if (!term) return [];
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.shortDescription.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term)) ||
        p.categorySlug.toLowerCase().includes(term)
    );
  }, [q]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (draft.trim()) navigate(`/search?q=${encodeURIComponent(draft.trim())}`);
  }

  return (
    <>
      <PageHero title="Search Results" subtitle={q ? `Showing results for "${q}"` : 'Search our full menu of desserts.'} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Search' }]} />
          <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto 48px', display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={60}
              placeholder="Search desserts..."
              style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 999, padding: '13px 20px', outline: 'none', fontFamily: 'Karla, sans-serif' }}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {results.length === 0 ? (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              }
              title={q ? `No results for "${q}"` : 'Start typing to search'}
              description="Try a category name like 'cakes' or 'pastries', or browse the full shop."
              actionLabel="Browse Shop"
              actionTo="/shop"
            />
          ) : (
            <div className="product-grid">
              {results.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
