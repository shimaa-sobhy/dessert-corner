import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getProductById } from '../data/products';
import type { CartLine } from '../lib/types';
import { useToast } from './ToastContext';

const SHIPPING_FLAT = 4.5;
const FREE_SHIPPING_THRESHOLD = 45;
const TAX_RATE = 0.08;
const COUPONS: Record<string, number> = {
  SWEET10: 0.1,
  WELCOME15: 0.15,
};

export interface CartLineWithProduct extends CartLine {
  product: ReturnType<typeof getProductById>;
}

interface CartContextValue {
  lines: CartLine[];
  linesWithProducts: CartLineWithProduct[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string | null;
  addItem: (productId: string, quantity?: number, silent?: boolean) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useLocalStorage<CartLine[]>('sucre_cart', []);
  const [couponCode, setCouponCode] = useLocalStorage<string | null>('sucre_coupon', null);
  const { showToast } = useToast();

  const addItem = useCallback(
    (productId: string, quantity = 1, silent = false) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l));
        }
        return [...prev, { productId, quantity }];
      });
      if (!silent) showToast('Added to cart');
    },
    [setLines, showToast]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
    },
    [setLines]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
    },
    [setLines, removeItem]
  );

  const clearCart = useCallback(() => {
    setLines([]);
    setCouponCode(null);
  }, [setLines, setCouponCode]);

  const linesWithProducts = useMemo<CartLineWithProduct[]>(
    () => lines.map((l) => ({ ...l, product: getProductById(l.productId) })).filter((l) => l.product),
    [lines]
  );

  const itemCount = useMemo(
    () => linesWithProducts.reduce((sum, l) => sum + l.quantity, 0),
    [linesWithProducts]
  );

  const subtotal = useMemo(
    () => linesWithProducts.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0),
    [linesWithProducts]
  );

  const discountRate = couponCode ? COUPONS[couponCode] ?? 0 : 0;
  const discount = useMemo(() => subtotal * discountRate, [subtotal, discountRate]);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = useMemo(() => (subtotal - discount) * TAX_RATE, [subtotal, discount]);
  const total = useMemo(() => Math.max(0, subtotal - discount + shipping + tax), [subtotal, discount, shipping, tax]);

  const applyCoupon = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (COUPONS[normalized]) {
        setCouponCode(normalized);
        showToast(`Coupon ${normalized} applied`);
      } else {
        showToast('Invalid coupon code');
      }
    },
    [setCouponCode, showToast]
  );

  const removeCoupon = useCallback(() => setCouponCode(null), [setCouponCode]);

  const value: CartContextValue = {
    lines,
    linesWithProducts,
    itemCount,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    couponCode,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

export { FREE_SHIPPING_THRESHOLD };
