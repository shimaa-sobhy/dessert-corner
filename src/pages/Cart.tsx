import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import QuantitySelector from '../components/QuantitySelector';
import Button from '../components/Button';
import { useCart, FREE_SHIPPING_THRESHOLD } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import type { CartLineWithProduct } from '../context/CartContext';

export default function Cart() {
  const { linesWithProducts, subtotal, shipping, tax, discount, total, couponCode, updateQuantity, removeItem, addItem, applyCoupon, removeCoupon } = useCart();
  const { showToast } = useToast();
  const [coupon, setCoupon] = useState('');
  const navigate = useNavigate();

  const handleRemove = useCallback(
    (line: CartLineWithProduct) => {
      removeItem(line.productId);
      showToast(`Removed ${line.product?.name ?? 'item'}`, {
        actionLabel: 'Undo',
        duration: 4500,
        onAction: () => addItem(line.productId, line.quantity, true),
      });
    },
    [removeItem, showToast, addItem]
  );

  if (linesWithProducts.length === 0) {
    return (
      <>
        <PageHero title="Your Cart" />
        <section className="section" style={{ paddingTop: 48 }}>
          <div className="container">
            <Breadcrumbs items={[{ label: 'Cart' }]} />
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 6h15l-1.5 9h-12z" />
                  <path d="M6 6L5 3H2" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </svg>
              }
              title="Your cart is empty"
              description="Add a few favorites and they'll show up here."
              actionLabel="Continue Shopping"
              actionTo="/shop"
            />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero title="Your Cart" subtitle={`${linesWithProducts.length} item${linesWithProducts.length > 1 ? 's' : ''} ready for checkout`} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Cart' }]} />
          <div className="cart-grid">
            <div className="cart-items">
              {linesWithProducts.map((line) => {
                const product = line.product!;
                return (
                  <div key={line.productId} className="surface cart-item">
                    <Link to={`/product/${product.slug}`} className="ci-img">
                      <img src={product.image} alt={product.name} width={88} height={88} />
                    </Link>
                    <div className="ci-main">
                      <Link to={`/product/${product.slug}`} className="ci-name">
                        {product.name}
                      </Link>
                      <div className="ci-price">${product.price.toFixed(2)} each</div>
                      <QuantitySelector value={line.quantity} onChange={(q) => updateQuantity(line.productId, q)} />
                    </div>
                    <div className="ci-side">
                      <div className="ci-total">${(product.price * line.quantity).toFixed(2)}</div>
                      <button type="button" className="ci-remove" onClick={() => handleRemove(line)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="surface">
              <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 18, marginBottom: 18, color: 'var(--ink)' }}>
                Order Summary
              </h3>

              {couponCode ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontSize: 13 }}>
                  <span className="badge badge-new">Coupon: {couponCode}</span>
                  <button type="button" onClick={removeCoupon} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 12 }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="coupon-row">
                  <input
                      type="text"
                      placeholder="Coupon code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      maxLength={20}
                      className="coupon-input"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const code = coupon.trim();
                        if (code) applyCoupon(code);
                        setCoupon('');
                      }}
                    >
                      Apply
                    </button>
                </div>
              )}

              <div style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--ink-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E8B57' }}>
                    <span>Discount</span>
                    <span>−${discount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD ? (
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 12 }}>
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping.
                </p>
              ) : null}

              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 20 }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Button block onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}