import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import LoadMoreButton from '../components/LoadMoreButton';
import FilterBottomSheet from '../components/FilterBottomSheet';
import FilterSidebar from '../components/FilterSidebar';
import SortBottomSheet from '../components/SortBottomSheet';
import SortDropdown, { type SortOption } from '../components/SortDropdown';
import EmptyState from '../components/EmptyState';
import { PRODUCTS } from '../data/products';

function usePageSize() {
  const [size, setSize] = useState(() => (window.innerWidth > 900 ? 6 : 4));
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setSize(e.matches ? 6 : 4);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return size;
}

const PRICE_CEILING = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)));

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest',
  'price-asc': 'Price: Low–High',
  'price-desc': 'Price: High–Low',
  'best-selling': 'Best Selling',
  popular: 'Most Popular',
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [filters, setFilters] = useState<{ categories: string[]; maxPrice: number; minRating: number; inStockOnly: boolean }>({
    categories: initialCategory ? [initialCategory] : [],
    maxPrice: PRICE_CEILING,
    minRating: 0,
    inStockOnly: false,
  });
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc' | 'best-selling' | 'popular'>('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const productsRef = useRef<HTMLDivElement>(null);
  const skipInitialScroll = useRef(true);
  const PAGE_SIZE = usePageSize();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { setPage(1); }, [PAGE_SIZE]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && !filters.categories.includes(cat)) {
      setFilters((f) => ({ ...f, categories: [cat] }));
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.categorySlug !== 'donuts' && p.price <= filters.maxPrice && p.rating >= filters.minRating);
    if (filters.categories.length > 0) list = list.filter((p) => filters.categories.includes(p.categorySlug));
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);

    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'best-selling':
        list = [...list].sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.reviewCount - a.reviewCount);
        break;
      case 'popular':
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      default:
        list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }

    return list;
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const productCount = filtered.length;

  useEffect(() => {
    // Only re-scroll to the grid when the user changes page — never on mount
    // (that would yank the hero/headline off-screen on every initial load).
    if (skipInitialScroll.current) {
      skipInitialScroll.current = false;
      return;
    }
    if (productsRef.current) {
      const y = productsRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [page]);

  function handleFilterChange(next: { categories: string[]; maxPrice: number; minRating: number; inStockOnly: boolean }) {
    setFilters(next);
    setPage(1);
    if (next.categories.length === 1) {
      setSearchParams({ category: next.categories[0] });
    } else {
      setSearchParams({});
    }
  }

  function handleSortChange(next: SortOption) {
    setSort(next);
    setPage(1);
  }

  function handleFilterOpen() {
    setShowFilters(true);
  }

  function handleFilterClose() {
    setShowFilters(false);
  }

  function handleSortOpen() {
    setShowSort(true);
  }

  function handleSortClose() {
    setShowSort(false);
  }

  function handleApplyFilters() {
    handleFilterChange(filters);
    setShowFilters(false);
  }

  function handleClearAll() {
    setFilters({
      categories: [],
      maxPrice: PRICE_CEILING,
      minRating: 0,
      inStockOnly: false,
    });
    setSearchParams({});
    setShowFilters(false);
  }

  return (
    <>
      <PageHero title="Shop All Desserts" subtitle="Every cake, pastry, and scoop we make — filtered and sorted your way." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Shop' }]} />
        </div>
        <div className="shop-layout">
          {!isMobile && (
            <FilterSidebar filters={filters} onChange={handleFilterChange} priceCeiling={PRICE_CEILING} />
          )}
          <div ref={productsRef}>
            <div className="desktop-toolbar shop-toolbar">
              <span style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>{productCount} products</span>
              <SortDropdown value={sort} onChange={handleSortChange} />
            </div>
            <div className="mobile-toolbar">
              <div className="shop-toolbar">
                <button
                  type="button"
                  className="filter-bar-btn"
                  onClick={handleFilterOpen}
                  aria-label="Open filters"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filter
                </button>
                <button
                  type="button"
                  className="sort-bar-btn"
                  onClick={handleSortOpen}
                  aria-label="Open sort options"
                >
                  Sort: {SORT_LABELS[sort]}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <span className="shop-toolbar-count">{productCount} products</span>
              </div>
            </div>

            {pageItems.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                }
                title="No products match your filters"
                description="Try widening your price range or clearing a filter."
              />
            ) : (
              <>
                <div className="product-grid">
                  {pageItems.map((p) => (
                    <ProductCard product={p} key={p.id} />
                  ))}
                </div>
                <LoadMoreButton
                  page={page}
                  totalPages={totalPages}
                  onLoadMore={setPage}
                />
              </>
            )}
          </div>

          {/* Filter Bottom Sheet */}
          <FilterBottomSheet
            filters={filters}
            onChange={handleFilterChange}
            onClear={() => handleClearAll()}
            priceCeiling={PRICE_CEILING}
            isOpen={showFilters}
            onClose={handleFilterClose}
            onApply={handleApplyFilters}
          />

          {/* Sort Bottom Sheet */}
          <SortBottomSheet
            value={sort}
            onChange={handleSortChange}
            isOpen={showSort}
            onClose={handleSortClose}
          />
        </div>
      </section>
    </>
  );
}