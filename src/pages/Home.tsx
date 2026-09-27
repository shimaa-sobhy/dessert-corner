import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import CloudLayer from '../components/CloudLayer';
import WaveDivider from '../components/WaveDivider';
import FloatingOrnaments from '../components/FloatingOrnaments';
import HeroDonutRow from '../components/HeroDonutRow';
import ArticleCard from '../components/ArticleCard';
import Newsletter from '../components/Newsletter';
import LocationMap from '../components/LocationMap';
import Button from '../components/Button';
import ProductCarousel from '../components/ProductCarousel';
import CategoryCarousel from '../components/CategoryCarousel';
import FeaturedSection from '../components/sections/FeaturedSection';
import LazyMount from '../components/LazyMount';
import { PRODUCTS, getProductById } from '../data/products';
import { REVIEWS } from '../data/reviews';
import { ARTICLES } from '../data/articles';

// Only the genuinely below-fold sections are IO-gated (lazy): category +
// featured live right at the fold on mobile, so they stay eager and laid
// out from first paint (no mount-time layout shift). Testimonials alone
// still pulls framer-motion, so it stays in its own async chunk.
const TestimonialsSection = lazy(() => import('../components/sections/TestimonialsSection'));

const FEATURED = getProductById('blueberry-cheesecake')!;
const GRID_PRODUCTS = PRODUCTS.filter((p) => (p.isBestSeller || p.isNew) && p.categorySlug !== 'donuts').slice(0, 8);
const FEATURED_REVIEWS = REVIEWS.slice(0, 4);
// Trust-signal aggregate: computed from the full review set so the headline
// number reflects every review, not just the 4 shown in the cards below.
const AVG_RATING =
  REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length;
const REVIEW_COUNT = REVIEWS.length;
const LATEST_ARTICLES = ARTICLES.filter((a) =>
  ['the-secret-to-soft-fluffy-donuts', 'choosing-the-finest-ingredients', 'inside-our-kitchen'].includes(a.slug)
);

const ORNAMENTS_ARTICLES = [
  { type: 'leaf' as const, top: '7%', left: '3%', delay: 1, size: 16 },
  { type: 'sparkle' as const, top: '10%', right: '5%', delay: 0.4 },
  { type: 'dot' as const, bottom: '8%', right: '4%', delay: 0.6 },
];
const ORNAMENTS_NEWSLETTER = [
  { type: 'sparkle' as const, top: '10%', left: '5%', delay: 0, size: 13 },
  { type: 'sparkle' as const, top: '8%', right: '6%', delay: 1.5, size: 11 },
  { type: 'sparkle' as const, bottom: '12%', left: '10%', delay: 0.8, size: 12 },
  { type: 'sparkle' as const, bottom: '10%', right: '8%', delay: 2.2, size: 10 },
];

function HeroSearchBox() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form className="hero-search" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Find your perfect dessert..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" className="hero-search-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        Search
      </button>
    </form>
  );
}

// Mounts the LazyMount gate + Suspense around a below-fold lazy section.
function LazySection({ children }: { children: ReactNode }) {
  return (
    <LazyMount>
      <Suspense fallback={null}>{children}</Suspense>
    </LazyMount>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="grain" />
        <CloudLayer />
        <div className="hero-body">
          <div className="hero-inner">
            <span className="hero-eyebrow">Small-batch bakery &amp; dessert shop</span>

            <h1 className="hero-headline">
              <span className="hero-headline-text">
                Where Sweet Dreams
                <br />
                Become <i>Delicious Reality</i>
              </span>
            </h1>

            <HeroDonutRow />

            <HeroSearchBox />
          </div>
        </div>
      </section>
      <WaveDivider color="#EAF6FF" variant="scallop" height={40} />

      <CategoryCarousel />

      <WaveDivider color="#FDE2EC" variant="wave" height={80} />

      {/* FEATURED PRODUCT */}
      <FeaturedSection product={FEATURED} />

      <WaveDivider color="#EAF6FF" variant="double-wave" height={80} />

      {/* PRODUCTS CAROUSEL */}
      <LazyMount>
        <ProductCarousel products={GRID_PRODUCTS} />
      </LazyMount>

      <WaveDivider color="#FDE2EC" variant="cloud" height={80} />

      {/* ── BOTTOM FLOW: Testimonials → Articles → Newsletter → Map ── */}

      {/* REVIEWS — centered grid, no bowl, premium cards */}
      <LazySection>
        <TestimonialsSection reviews={FEATURED_REVIEWS} avgRating={AVG_RATING} reviewCount={REVIEW_COUNT} />
      </LazySection>

      {/* ARTICLES — flowing directly from testimonials */}
      <LazyMount>
        <section className="section articles-section">
          <FloatingOrnaments items={ORNAMENTS_ARTICLES} />
          <div className="section-head-row">
            <div>
              <span className="eyebrow">From the journal</span>
              <h2>Latest articles</h2>
            </div>
            <Button to="/blog" variant="outline">Visit the Blog</Button>
          </div>
          <div className="article-grid">
            {LATEST_ARTICLES.map((a) => (
              <ArticleCard article={a} key={a.slug} />
            ))}
          </div>
        </section>
      </LazyMount>

      <WaveDivider color="#FFF5FA" variant="blob" height={60} />

      {/* NEWSLETTER + MAP (combined closing section) */}
      <LazyMount>
        <section className="section newsletter-section" style={{ paddingBottom: 0 }}>
          <div className="sky-clouds" aria-hidden="true">
            <div className="sky-cloud sky-cloud--9 sky-cloud-md" />
            <div className="sky-cloud sky-cloud--10 sky-cloud-md" />
            <div className="sky-cloud sky-cloud--1 sky-cloud-md" />
            <div className="sky-cloud sky-cloud--2 sky-cloud-md" />
            <div className="sky-cloud sky-cloud--3 sky-cloud-sm" />
            <div className="sky-cloud sky-cloud--4 sky-cloud-mobile" />
            <div className="sky-cloud sky-cloud--5 sky-cloud-sm" />
            <div className="sky-cloud sky-cloud--6 sky-cloud-mobile" />
            <div className="sky-cloud sky-cloud--7 sky-cloud-sm" />
            <div className="sky-cloud sky-cloud--8" />
          </div>
          <FloatingOrnaments items={ORNAMENTS_NEWSLETTER} />
          <Newsletter />
          <div className="section-head">
            <span className="eyebrow">Find us</span>
            <h2>Come say hello</h2>
          </div>
          <LocationMap />
        </section>
      </LazyMount>
    </>
  );
}