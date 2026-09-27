import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { getProductById } from '../data/products';

const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [ids, setIds] = useLocalStorage<string[]>('sucre_recently_viewed', []);

  const track = useCallback(
    (productId: string) => {
      setIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_ITEMS));
    },
    [setIds]
  );

  const products = useMemo(() => ids.map((id) => getProductById(id)).filter(Boolean), [ids]);

  return { products, track };
}
