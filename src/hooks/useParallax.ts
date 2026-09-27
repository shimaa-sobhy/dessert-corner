import { useEffect, type RefObject } from 'react';
import { gsap } from '../lib/gsap';
import { EASE } from '../lib/motion';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface ParallaxLayer {
  ref: RefObject<HTMLElement>;
  /** Pixels of travel at the extreme edge of the container. */
  depth: number;
  /** Degrees of rotation at the extreme edge (0 to skip rotation). */
  rot?: number;
}

/**
 * Soft 3D parallax: each registered layer drifts a different amount as the
 * mouse moves across `containerRef`, giving the hero a sense of depth.
 * All layers ease back to rest on mouseleave.
 */
export function useParallax(
  containerRef: RefObject<HTMLElement>,
  layers: ParallaxLayer[]
) {
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const container = containerRef.current;
    if (!container) return;

    const setters = layers
      .filter((l) => l.ref.current)
      .map((l) => ({
        x: gsap.quickTo(l.ref.current as HTMLElement, 'x', { duration: 0.9, ease: EASE.out }),
        y: gsap.quickTo(l.ref.current as HTMLElement, 'y', { duration: 0.9, ease: EASE.out }),
        rz: l.rot
          ? gsap.quickTo(l.ref.current as HTMLElement, 'rotate', { duration: 0.9, ease: EASE.out })
          : null,
        depth: l.depth,
        rot: l.rot ?? 0,
      }));

    const handleMove = (e: MouseEvent) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      setters.forEach((s) => {
        s.x(cx * s.depth);
        s.y(cy * s.depth * 0.6);
        s.rz?.(cx * s.rot);
      });
    };
    const handleLeave = () => {
      setters.forEach((s) => {
        s.x(0);
        s.y(0);
        s.rz?.(0);
      });
    };

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, [containerRef, layers, prefersReduced]);
}
