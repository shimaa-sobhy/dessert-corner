const prefetchers: Record<string, () => Promise<unknown>> = {
  '/shop': () => import('../pages/Shop'),
  '/categories': () => import('../pages/Categories'),
  '/blog': () => import('../pages/Blog'),
  '/about': () => import('../pages/About'),
  '/contact': () => import('../pages/Contact'),
  '/wishlist': () => import('../pages/Wishlist'),
  '/cart': () => import('../pages/Cart'),
  '/login': () => import('../pages/Login'),
};

export function prefetchRoute(path: string): void {
  const load = prefetchers[path];
  if (load) void load().catch(() => undefined);
}

export function prefetchAllTopLevel(): void {
  const start = () => {
    for (const path of Object.keys(prefetchers)) {
      const load = prefetchers[path];
      if (load) void load().catch(() => undefined);
    }
  };
  const idle = (window as { requestIdleCallback?: (cb: () => void, opts: { timeout: number }) => void }).requestIdleCallback;
  if (idle) idle(start, { timeout: 2500 });
  else setTimeout(start, 1500);
}