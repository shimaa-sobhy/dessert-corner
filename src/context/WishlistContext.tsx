import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getProductById } from '../data/products';
import { useToast } from './ToastContext';

interface WishlistContextValue {
  productIds: string[];
  products: ReturnType<typeof getProductById>[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useLocalStorage<string[]>('sucre_wishlist', []);
  const { showToast } = useToast();

  const isWishlisted = useCallback((productId: string) => productIds.includes(productId), [productIds]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setProductIds((prev) => {
        if (prev.includes(productId)) {
          showToast('Removed from wishlist');
          return prev.filter((id) => id !== productId);
        }
        showToast('Added to wishlist');
        return [...prev, productId];
      });
    },
    [setProductIds, showToast]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setProductIds((prev) => prev.filter((id) => id !== productId));
    },
    [setProductIds]
  );

  const products = useMemo(() => productIds.map((id) => getProductById(id)).filter(Boolean), [productIds]);

  return (
    <WishlistContext.Provider value={{ productIds, products, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
