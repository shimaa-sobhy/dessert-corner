/**
 * Shared motion tokens. Keeping durations/easings here means every
 * hook and component references the same "feel" instead of
 * hand-tuning numbers in a dozen places.
 */

export const EASE = {
  out: 'power3.out',
  softOut: 'power2.out',
  inOut: 'sine.inOut',
  inertia: 'power4.out',
  elastic: 'elastic.out(1, 0.4)',
  back: 'back.out(1.5)',
} as const;

export const DURATION = {
  fast: 0.35,
  base: 0.6,
  slow: 0.9,
  cinematic: 1.3,
} as const;

/** Idle donut rotation: one full turn every 25-35s, picked per-mount for variety. */
export function randomIdleDuration(): number {
  return 25 + Math.random() * 10;
}

/** How long the inertia "spin" burst on navigation runs, in seconds. */
export const SPIN_INERTIA_DURATION = 1.15;

/** Extra full turns added on top of the current rotation for the inertia burst. */
export const SPIN_INERTIA_TURNS = 1080;

/** Faster rotation speed (seconds/turn) used while a donut is hovered. */
export const HOVER_ROTATION_SPEED = 6;

/** Max tilt in degrees applied when hovering the active donut. */
export const HOVER_TILT_MAX_DEG = 22;
