import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

type Target = RefObject<HTMLElement> | RefObject<HTMLElement>[];

export interface ScrollRevealOptions {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
  start?: string;
  stagger?: number;
  /** Extra delay applied per-index when `target` is an array (e.g. i % 3 * 0.1). */
  perIndexDelay?: (index: number) => number;
}

function resolveElements(target: Target): HTMLElement[] {
  if (Array.isArray(target)) {
    return target.map((r) => r.current).filter((el): el is HTMLElement => Boolean(el));
  }
  return target.current ? [target.current] : [];
}

/**
 * Wraps GSAP + ScrollTrigger so every section can declare its *own* entrance
 * animation (fromVars/toVars) instead of every section sharing one
 * fade-up. Pass an array of refs to get a staggered reveal across siblings.
 */
export function useScrollReveal(target: Target, options: ScrollRevealOptions) {
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const elements = resolveElements(target);
    if (elements.length === 0) return;

    if (prefersReduced) {
      gsap.set(elements, { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: 'none' });
      return;
    }

    const triggers: ScrollTrigger[] = [];
    elements.forEach((el, i) => {
      const delay = options.perIndexDelay ? options.perIndexDelay(i) : (options.stagger ?? 0) * i;
      const tween = gsap.fromTo(el, options.from, {
        ...options.to,
        delay,
        scrollTrigger: {
          trigger: el,
          start: options.start ?? 'top 85%',
        },
      });
      const st = tween.scrollTrigger;
      if (st) triggers.push(st);
    });

    return () => triggers.forEach((t) => t.kill());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);
}
