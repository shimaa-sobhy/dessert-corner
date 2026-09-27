import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import StarRating from './StarRating';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface Props {
  product: Product;
}

function ProductCard({ product }: Props) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const wishlisted = isWishlisted(product.id);

  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className="product-card-media">
        {product.isBestSeller ? <span className="product-card-badge">Best Seller</span> : null}
        {!product.isBestSeller && product.isNew ? (
          <span className="product-card-badge" style={{ background: '#2E8B57' }}>
            New
          </span>
        ) : null}
        <button
          type="button"
          className={`product-card-wish${wishlisted ? ' active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
        <div className="pc-img-float">
          <img src={product.image} alt={product.name} loading="lazy" width={280} height={280} />
        </div>
      </div>
      <div className="product-card-cat">{product.categorySlug.replace('-', ' ')}</div>
      <h3 className="product-card-name">{product.name}</h3>
      <div className="product-card-rating">
        <StarRating rating={product.rating} size={12} />
        <span>({product.reviewCount})</span>
      </div>
      <div className="product-card-footer">
        <span className="product-card-price">
          {product.oldPrice ? <s>${product.oldPrice.toFixed(2)}</s> : null}${product.price.toFixed(2)}
        </span>
        <button
          type="button"
          className="product-card-add"
          disabled={!product.inStock}
          onClick={(e) => {
            e.preventDefault();
            addItem(product.id, 1);
          }}
          aria-label="Add to cart"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6L5 3H2" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
        </button>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
