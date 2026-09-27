import { useState } from 'react';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import type { OrderStatus } from '../lib/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function MyOrders() {
  const { orders } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <PageHero title="My Orders" subtitle="Every order you've placed, with live status." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Account', to: '/account' }, { label: 'My Orders' }]} />

          {orders.length === 0 ? (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 7h16v13H4z" />
                  <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                </svg>
              }
              title="No orders yet"
              description="Once you place an order, it will show up here with tracking details."
              actionLabel="Browse Shop"
              actionTo="/shop"
            />
          ) : (
            <div style={{ display: 'grid', gap: 16, maxWidth: 800 }}>
              {orders.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <div className="surface" key={order.id}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{order.id}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                          {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {order.items.length} items
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span className={`badge badge-status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
                        <span style={{ fontWeight: 800, color: 'var(--ink)' }}>${order.total.toFixed(2)}</span>
                        <span style={{ color: 'var(--ink-soft)' }}>{isOpen ? '−' : '+'}</span>
                      </div>
                    </button>
                    {isOpen ? (
                      <div style={{ marginTop: 18 }}>
                        <div className="divider" />
                        <div style={{ display: 'grid', gap: 10 }}>
                          {order.items.map((item) => (
                            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img src={item.image} alt={item.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: 'var(--cream-dim)' }} />
                              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)' }}>
                                {item.name} × {item.quantity}
                              </div>
                              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="divider" />
                        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                          Delivered to {order.address.line1}, {order.address.city} — {order.deliveryMethod === 'express' ? 'Express' : 'Standard'} delivery,{' '}
                          {order.paymentMethod === 'card' ? 'paid by card' : 'cash on delivery'}.
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
