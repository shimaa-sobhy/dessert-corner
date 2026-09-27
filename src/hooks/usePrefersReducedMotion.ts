import { useEffect, useState } from 'react';

/**
 * Tracks the user's `prefers-reduced-motion` setting live, so components
 * can disable continuous/ambient animation without a page reload.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * True when the pointer is fine (mouse/trackpad) and hover is supported.
 * Used to gate cursor-follow, magnetic buttons, and hover-tilt — none of
 * which make sense on touch.
 */
export function useCanHoverFine(): boolean {
  const [canHover] = useState<boolean>(
    () => window.matchMedia('(hover:hover) and (pointer:fine)').matches
  );
  return canHover;
}
