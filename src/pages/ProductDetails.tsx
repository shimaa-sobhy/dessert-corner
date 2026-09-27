import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import ImageZoom from '../components/ImageZoom';
import StarRating from '../components/StarRating';
import QuantitySelector from '../components/QuantitySelector';
import Button from '../components/Button';
import PcCard from '../components/PcCard';
import ReviewList from '../components/ReviewList';
import { getProduct, getRelatedProducts } from '../data/products';
import { getReviewsForProduct } from '../data/reviews';
import { getCategory } from '../data/categories';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

const TABS = ['Description', 'Ingredients', 'Nutrition', 'Delivery'] as const;

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProduct(slug) : undefined;
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { products: recentlyViewed, track } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Description');

  useEffect(() => {
    if (product) track(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return <Navigate to="/shop" replace />;

  const category = getCategory(product.categorySlug);
  const related = getRelatedProducts(product);
  const reviews = getReviewsForProduct(product.id);
  const reviewSummary =
    reviews.length > 0
      ? { rating: Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10, count: reviews.length }
      : null;
  const wishlisted = isWishlisted(product.id);
  const recentExcludingCurrent = recentlyViewed.filter((p) => p?.id !== product.id);

  return (
    <section className="section" style={{ paddingTop: 36 }}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: category?.name ?? '', to: `/shop?category=${product.categorySlug}` }, { label: product.name }]} />
      </div>

      <div className="container prod-details-grid">
        <ImageZoom src={product.image} alt={product.name} />

        <div>
          <span className="product-card-cat">{category?.name}</span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(28px,3.2vw,38px)', margin: '8px 0 10px', color: 'var(--ink)' }}>
            {product.name}
          </h1>
          {reviewSummary ? (
            <StarRating rating={reviewSummary.rating} showValue reviewCount={reviewSummary.count} />
          ) : (
            <span className="pdp-no-reviews">No reviews yet — be the first to leave one.</span>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '18px 0' }}>
            {product.oldPrice ? (
              <span style={{ fontSize: 18, color: 'var(--ink-soft)', textDecoration: 'line-through' }}>${product.oldPrice.toFixed(2)}</span>
            ) : null}
            <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)' }}>${product.price.toFixed(2)}</span>
            {!product.inStock ? <span className="badge badge-out">Out of stock</span> : null}
          </div>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8 }}>{product.shortDescription}</p>

          <div className="pdp-actions">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <Button disabled={!product.inStock} onClick={() => addItem(product.id, quantity)}>
              Add to Cart — ${(product.price * quantity).toFixed(2)}
            </Button>
            <button
              type="button"
              className={`btn-icon${wishlisted ? ' active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
            </button>
          </div>

          <div className="divider" />

          <div className="tabs-head">
            {TABS.map((tab) => (
              <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          <div className="pdp-tab-body">
            {activeTab === 'Description' && <p>{product.description}</p>}
            {activeTab === 'Ingredients' && (
              <ul className="pdp-ingredients">
                {product.ingredients.map((ing) => (
                  <li key={ing}>{ing}</li>
                ))}
              </ul>
            )}
            {activeTab === 'Nutrition' && (
              <div className="pdp-facts">
                <div className="pdp-facts-title">Nutrition Facts</div>
                <div className="pdp-facts-serving">Serving size: {product.nutrition.servingSize}</div>
                <div className="pdp-facts-divider" />
                <div className="pdp-facts-row">
                  <span>Calories</span>
                  <b>{product.nutrition.calories}</b>
                </div>
                <div className="pdp-facts-row">
                  <span>Total Fat</span>
                  <b>{product.nutrition.fat}</b>
                </div>
                <div className="pdp-facts-row">
                  <span>Sugars</span>
                  <b>{product.nutrition.sugar}</b>
                </div>
                <div className="pdp-facts-row">
                  <span>Protein</span>
                  <b>{product.nutrition.protein}</b>
                </div>
              </div>
            )}
            {activeTab === 'Delivery' && (
              <div className="pdp-delivery">
                <p>{product.deliveryInfo}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1180, margin: '0 auto 80px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, marginBottom: 24, color: 'var(--ink)' }}>
          Customer Reviews
        </h2>
        <ReviewList reviews={reviews} />
      </div>

      {related.length > 0 ? (
        <div className="container" style={{ maxWidth: 1180, margin: '0 auto 80px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, marginBottom: 24, color: 'var(--ink)' }}>
            You might also like
          </h2>
          <div className="pc-grid">
            {related.map((p) => (
              <div className="pc-slide" key={p.id}>
                <PcCard product={p} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recentExcludingCurrent.length > 0 ? (
        <div className="container" style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 22, marginBottom: 24, color: 'var(--ink)' }}>
            Recently viewed
          </h2>
          <div className="pc-grid">
            {recentExcludingCurrent.slice(0, 4).map((p) => (
              <div className="pc-slide" key={p!.id}>
                <PcCard product={p!} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="container" style={{ textAlign: 'center', marginTop: 60 }}>
        <Link to="/shop" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>
          ← Back to Shop
        </Link>
      </div>
    </section>
  );
}
