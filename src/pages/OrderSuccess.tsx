import { Navigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import type { Order } from '../lib/types';

export default function OrderSuccess() {
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;

  if (!order) return <Navigate to="/" replace />;

  return (
    <section className="section" style={{ textAlign: 'center', paddingTop: 90 }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: '#E4F4E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2E8B57" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <span className="eyebrow">Order confirmed</span>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(26px,3.4vw,38px)', margin: '10px 0', color: 'var(--ink)' }}>
          Thank you, your order is on its way
        </h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
          Order <strong>{order.id}</strong> has been placed. A confirmation has been sent to your email, and you can track its
          status from your account.
        </p>

        <p className="co-demo-note" id="co-demo-note" style={{ maxWidth: 460, margin: '0 auto 32px' }}>
          This is a demo storefront — no real payment was processed and no order will actually be shipped.
        </p>

        <div className="surface" style={{ textAlign: 'left', marginBottom: 32 }}>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {order.items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--ink-soft)' }}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--ink)' }}>
            <span>Total Paid</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button to="/shop" variant="outline">
            Continue Shopping
          </Button>
          <Button to="/account/orders">View My Orders</Button>
        </div>
      </div>
    </section>
  );
}
