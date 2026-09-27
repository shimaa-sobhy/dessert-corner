import { useEffect, type RefObject } from 'react';
import { gsap } from '../lib/gsap';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface FloatConfig {
  ref: RefObject<HTMLElement>;
  y?: number;
  x?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
}

/**
 * Gives every registered element a subtle, staggered yoyo float — used for
 * dessert trinkets, sprinkle/cream/chocolate decorations, and the glow
 * blobs behind the carousel, so nothing on screen sits perfectly still.
 */
export function useAmbientFloat(configs: FloatConfig[]) {
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const tweens = configs
      .filter((c) => c.ref.current)
      .map((c) =>
        gsap.to(c.ref.current as HTMLElement, {
          y: c.y ?? 0,
          x: c.x ?? 0,
          rotate: c.rotate !== undefined ? `+=${c.rotate}` : undefined,
          duration: c.duration ?? 3,
          delay: c.delay ?? 0,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      );
    return () => tweens.forEach((t) => t.kill());
    // configs is expected to be a stable array built with useMemo by callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);
}
