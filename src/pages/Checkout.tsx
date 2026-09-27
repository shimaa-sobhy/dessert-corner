import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import type { Address, Order } from '../lib/types';

type DeliveryMethod = 'standard' | 'express';
type PaymentMethod = 'card' | 'cod';
type FieldName = 'fullName' | 'email' | 'phone' | 'line1' | 'city' | 'postalCode' | 'cardNumber' | 'cardExpiry' | 'cardCvc';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidExpiry(value: string): boolean {
  const m = value.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = parseInt(m[2], 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expiry = new Date(year, month, 0);
  return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
}

type Rule = (value: string) => string | null;
const ruleRequired = (msg: string): Rule => (value) => (value ? null : msg);
const ruleEmail: Rule = (value) => {
  const v = value.trim();
  if (!v) return 'Email is required';
  return EMAIL_RE.test(v) ? null : 'Enter a valid email address';
};
const rulePhone: Rule = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'Phone number is required';
  return digits.length >= 10 ? null : 'Use a valid number, e.g. +20 1XX XXX XXXX';
};
const rulePostal: Rule = (value) => {
  if (!value) return 'Postal code is required';
  return value.length >= 3 ? null : 'Enter a valid postal code';
};
const ruleCardNumber: Rule = (value) => {
  const digits = value.replace(/\s/g, '');
  if (!digits) return 'Card number is required';
  return digits.length >= 13 && digits.length <= 19 ? null : 'Enter a valid card number';
};
const ruleCvc: Rule = (value) => {
  if (!value) return 'CVC is required';
  return value.length >= 3 && value.length <= 4 ? null : 'Invalid CVC';
};

type FieldView = { status: 'idle' | 'valid' | 'error'; message: string };

function CheckoutField({
  id,
  label,
  required,
  status,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  status: FieldView;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="required-star" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {status.status === 'error' ? <span className="field-error">{status.message}</span> : null}
      {status.status === 'valid' ? (
        <span className="field-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2E8B57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Looks good
        </span>
      ) : null}
    </div>
  );
}

export default function Checkout() {
  const { linesWithProducts, subtotal, shipping, tax, discount, total, clearCart } = useCart();
  const { user, addresses, placeOrder } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [line1, setLine1] = useState(addresses[0]?.line1 ?? '');
  const [city, setCity] = useState(addresses[0]?.city ?? '');
  const [postalCode, setPostalCode] = useState(addresses[0]?.postalCode ?? '');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (linesWithProducts.length === 0 && !placing) {
      navigate('/cart');
    }
  }, [linesWithProducts.length, placing, navigate]);

  if (linesWithProducts.length === 0) {
    return null;
  }

  const cardActive = paymentMethod === 'card';
  const expressFee = deliveryMethod === 'express' ? 6 : 0;
  const finalShipping = shipping + expressFee;
  const finalTotal = total + expressFee;

  const values: Record<FieldName, string> = { fullName, email, phone, line1, city, postalCode, cardNumber, cardExpiry, cardCvc };
  const rules: Record<FieldName, Rule> = {
    fullName: ruleRequired('Full name is required'),
    email: ruleEmail,
    phone: rulePhone,
    line1: ruleRequired('Street address is required'),
    city: ruleRequired('City is required'),
    postalCode: rulePostal,
    cardNumber: ruleCardNumber,
    cardExpiry: (v) => (v ? (isValidExpiry(v) ? null : 'Invalid or expired') : 'Expiry is required'),
    cardCvc: ruleCvc,
  };

  function markTouched(name: FieldName) {
    setTouched((s) => (s[name] ? s : { ...s, [name]: true }));
  }

  function fieldStatus(name: FieldName): FieldView {
    if (!touched[name]) return { status: 'idle', message: '' };
    const msg = rules[name](values[name].trim());
    if (msg) return { status: 'error', message: msg };
    return { status: 'valid', message: '' };
  }

  function inputCls(name: FieldName): string | undefined {
    const status = fieldStatus(name).status;
    return status === 'error' ? 'input-invalid' : status === 'valid' ? 'input-valid' : undefined;
  }

  const detailsValid = ['fullName', 'email', 'phone', 'line1', 'city', 'postalCode'].every((n) => rules[n as FieldName](values[n as FieldName].trim()) === null);
  const paymentValid =
    !cardActive ||
    (rules.cardNumber(cardNumber) === null && rules.cardExpiry(cardExpiry) === null && rules.cardCvc(cardCvc) === null);
  const formComplete = detailsValid && paymentValid;

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
    markTouched('cardNumber');
    setCardNumber(formatCardNumber(e.target.value));
  }

  function handleCardExpiry(e: React.ChangeEvent<HTMLInputElement>) {
    markTouched('cardExpiry');
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    setCardExpiry(v);
  }

  function handleCardCvc(e: React.ChangeEvent<HTMLInputElement>) {
    markTouched('cardCvc');
    setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
  }

  function touch(name: FieldName) {
    if (!touched[name]) markTouched(name);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (placing || !formComplete) return;
    setPlacing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const address: Address = {
        id: `addr_${Date.now()}`,
        label: 'Checkout address',
        fullName,
        line1,
        city,
        postalCode,
        phone,
      };

      const order: Order = {
        id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString(),
        status: 'processing',
        items: linesWithProducts.map((l) => ({
          productId: l.productId,
          name: l.product!.name,
          image: l.product!.image,
          price: l.product!.price,
          quantity: l.quantity,
        })),
        subtotal,
        shipping: finalShipping,
        tax,
        discount,
        total: finalTotal,
        address,
        deliveryMethod,
        paymentMethod,
      };

      placeOrder(order);
      clearCart();
      navigate('/order-success', { state: { order } });
    } catch {
      setPlacing(false);
    }
  }

  return (
    <>
      <PageHero title="Checkout" subtitle="Almost there — just a few details and it's on its way." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

          <ol className="co-steps" aria-label="Checkout progress">
            <li className="co-step done">
              <span className="co-dot" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <span className="co-label">Cart</span>
            </li>
            <li className="co-step active" aria-current="step">
              <span className="co-dot" aria-hidden="true">2</span>
              <span className="co-label">Shipping</span>
            </li>
            <li className="co-step">
              <span className="co-dot" aria-hidden="true">3</span>
              <span className="co-label">Payment</span>
            </li>
            <li className="co-step">
              <span className="co-dot" aria-hidden="true">4</span>
              <span className="co-label">Confirm</span>
            </li>
          </ol>

          <p className="legend-required">
            <span className="required-star" aria-hidden="true">*</span> Required fields
          </p>

          <form noValidate onSubmit={handleSubmit} className="checkout-grid">
            <div style={{ display: 'grid', gap: 28 }}>
              <div className="surface">
                <div className="co-section-title">
                  <span className="co-section-num" aria-hidden="true">1</span>
                  <h3>Customer Information</h3>
                </div>
                <div className="field-row">
                  <CheckoutField id="fullName" label="Full Name" required status={fieldStatus('fullName')}>
                    <input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        markTouched('fullName');
                        setFullName(e.target.value);
                      }}
                      onBlur={() => touch('fullName')}
                      className={inputCls('fullName')}
                    />
                  </CheckoutField>
                  <CheckoutField id="email" label="Email" required status={fieldStatus('email')}>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        markTouched('email');
                        setEmail(e.target.value);
                      }}
                      onBlur={() => touch('email')}
                      className={inputCls('email')}
                    />
                  </CheckoutField>
                </div>
                <CheckoutField id="phone" label="Phone Number" required status={fieldStatus('phone')}>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+20 1XX XXX XXXX"
                    value={phone}
                    onChange={(e) => {
                      markTouched('phone');
                      setPhone(e.target.value);
                    }}
                    onBlur={() => touch('phone')}
                    className={inputCls('phone')}
                  />
                </CheckoutField>
              </div>

              <div className="surface">
                <div className="co-section-title">
                  <span className="co-section-num" aria-hidden="true">2</span>
                  <h3>Shipping Address</h3>
                </div>
                <CheckoutField id="line1" label="Street Address" required status={fieldStatus('line1')}>
                  <input
                    id="line1"
                    name="line1"
                    autoComplete="street-address"
                    value={line1}
                    onChange={(e) => {
                      markTouched('line1');
                      setLine1(e.target.value);
                    }}
                    onBlur={() => touch('line1')}
                    className={inputCls('line1')}
                  />
                </CheckoutField>
                <div className="field-row">
                  <CheckoutField id="city" label="City" required status={fieldStatus('city')}>
                    <input
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => {
                        markTouched('city');
                        setCity(e.target.value);
                      }}
                      onBlur={() => touch('city')}
                      className={inputCls('city')}
                    />
                  </CheckoutField>
                  <CheckoutField id="postalCode" label="Postal Code" required status={fieldStatus('postalCode')}>
                    <input
                      id="postalCode"
                      name="postalCode"
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(e) => {
                        markTouched('postalCode');
                        setPostalCode(e.target.value);
                      }}
                      onBlur={() => touch('postalCode')}
                      className={inputCls('postalCode')}
                    />
                  </CheckoutField>
                </div>
              </div>

              <div className="surface">
                <div className="co-section-title">
                  <span className="co-section-num" aria-hidden="true">3</span>
                  <h3>Delivery Method</h3>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <label className={`radio-card${deliveryMethod === 'standard' ? ' selected' : ''}`}>
                    <input type="radio" name="delivery" checked={deliveryMethod === 'standard'} onChange={() => setDeliveryMethod('standard')} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Standard Delivery — 1–2 days</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{shipping === 0 ? 'Free on this order' : `$${shipping.toFixed(2)}`}</div>
                    </div>
                  </label>
                  <label className={`radio-card${deliveryMethod === 'express' ? ' selected' : ''}`}>
                    <input type="radio" name="delivery" checked={deliveryMethod === 'express'} onChange={() => setDeliveryMethod('express')} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Express Delivery — same day</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>+$6.00</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="surface">
                <div className="co-section-title">
                  <span className="co-section-num" aria-hidden="true">4</span>
                  <h3>Payment Method</h3>
                </div>
                <p className="co-secure-line">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your payment info is encrypted and secure.
                </p>
                <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                  <label className={`radio-card${paymentMethod === 'card' ? ' selected' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Credit / Debit Card</div>
                  </label>
                  <label className={`radio-card${paymentMethod === 'cod' ? ' selected' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Cash on Delivery</div>
                  </label>
                </div>
                <div className="payment-fields-wrap">
                  <AnimatePresence mode="wait" initial={false}>
                    {cardActive ? (
                      <motion.div
                        key="card"
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <CheckoutField id="cardNumber" label="Card Number" required status={fieldStatus('cardNumber')}>
                          <input
                            id="cardNumber"
                            name="cardNumber"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength={19}
                            placeholder="4242 4242 4242 4242"
                            value={cardNumber}
                            onChange={handleCardNumber}
                            onBlur={() => touch('cardNumber')}
                            className={inputCls('cardNumber')}
                          />
                          <div className="pay-brands" aria-label="Accepted payment methods">
                            <span className="pay-brand">VISA</span>
                            <span className="pay-brand">Mastercard</span>
                            <span className="pay-brand">AMEX</span>
                            <span className="pay-brand">Discover</span>
                          </div>
                        </CheckoutField>
                        <div className="field-row">
                          <CheckoutField id="cardExpiry" label="Expiry" required status={fieldStatus('cardExpiry')}>
                            <input
                              id="cardExpiry"
                              name="cardExpiry"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              maxLength={5}
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={handleCardExpiry}
                              onBlur={() => touch('cardExpiry')}
                              className={inputCls('cardExpiry')}
                            />
                          </CheckoutField>
                          <CheckoutField id="cardCvc" label="CVC" required status={fieldStatus('cardCvc')}>
                            <input
                              id="cardCvc"
                              name="cardCvc"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              maxLength={4}
                              placeholder="123"
                              value={cardCvc}
                              onChange={handleCardCvc}
                              onBlur={() => touch('cardCvc')}
                              className={inputCls('cardCvc')}
                            />
                          </CheckoutField>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="cod"
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, overflow: 'hidden' }}
                      >
                        Pay with cash when your order arrives.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="surface co-summary" style={{ position: 'sticky', top: 100 }}>
              <div className="co-section-title">
                <h3>Order Summary</h3>
              </div>
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                {linesWithProducts.map((l) => (
                  <div key={l.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--ink-soft)' }}>
                    <span>
                      {l.product!.name} × {l.quantity}
                    </span>
                    <span>${(l.product!.price * l.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="divider" />
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
                  <span>{finalShipping === 0 ? 'Free' : `$${finalShipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>

              <Button block type="submit" disabled={!formComplete || placing} className="co-place-btn">
                {placing ? (
                  <>
                    <span className="co-spinner" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
              <p className="co-terms" id="co-terms">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                By placing your order you agree to our Terms &amp; Privacy Policy.
              </p>
              <p className="co-demo-note" id="co-demo-note">
                This is a demo storefront — no real payment is processed and no order is actually shipped.
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}