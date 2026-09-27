import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { products } = useWishlist();

  return (
    <>
      <PageHero title="Your Wishlist" subtitle="Everything you've saved for later, in one place." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Wishlist' }]} />
          {products.length === 0 ? (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
              }
              title="Your wishlist is empty"
              description="Tap the heart icon on any product to save it here for later."
              actionLabel="Browse Shop"
              actionTo="/shop"
            />
          ) : (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard product={p!} key={p!.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
