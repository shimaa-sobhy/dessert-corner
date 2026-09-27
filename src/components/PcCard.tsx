import { memo } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { useCart } from '../context/CartContext';
import type { Product } from '../lib/types';

function PcCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  return (
    <Link to={`/product/${product.slug}`} className="pc-card" draggable={false}>
      <div className="pc-card-media">
        {product.isBestSeller ? (
          <span className="pc-badge">Best Seller</span>
        ) : product.isNew ? (
          <span className="pc-badge pc-badge-new">New</span>
        ) : null}
        <div className="pc-img-float">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={280}
            height={280}
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = '0';
            }}
          />
        </div>
      </div>

      <span className="pc-cat">{product.categorySlug.replace('-', ' ')}</span>
      <h3 className="pc-name">{product.name}</h3>
      <div className="pc-rating">
        <StarRating rating={product.rating} size={12} />
        <span>({product.reviewCount})</span>
      </div>
      <div className="pc-footer">
        <span className="pc-price">${product.price.toFixed(2)}</span>
        <button
          type="button"
          className="pc-add-btn"
          disabled={!product.inStock}
          aria-label="Add to cart"
          onClick={(e) => { e.preventDefault(); addItem(product.id, 1); }}
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

export default memo(PcCard);