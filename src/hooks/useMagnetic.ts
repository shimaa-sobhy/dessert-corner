import { useEffect, type RefObject } from 'react';
import { gsap } from '../lib/gsap';
import { EASE } from '../lib/motion';
import { usePrefersReducedMotion, useCanHoverFine } from './usePrefersReducedMotion';

/**
 * Makes an element gently "pull" toward the cursor while hovered, then
 * snap back with a soft elastic ease on mouseleave. Used on primary/ghost
 * buttons and the carousel's prev/next arrows.
 */
export function useMagnetic<T extends HTMLElement>(
  ref: RefObject<T>,
  strength = 0.35
) {
  const prefersReduced = usePrefersReducedMotion();
  const canHoverFine = useCanHoverFine();

  useEffect(() => {
    if (prefersReduced || !canHoverFine) return;
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      gsap.to(el, { x, y, duration: 0.35, ease: EASE.out });
    };
    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: EASE.elastic });
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [ref, strength, prefersReduced, canHoverFine]);
}
