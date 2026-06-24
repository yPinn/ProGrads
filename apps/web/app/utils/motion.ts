// Central @vueuse/motion presets (JS-driven entrance animations).
//
// These numeric values MIRROR the CSS motion tokens in app/assets/css/main.css
// (--duration-* / --ease-standard). JS-driven inline styles can't read CSS vars,
// so the values live here too — keep the two in sync if you change one.
//
// All entrance animation flows through motionFadeUp() so it can't drift between
// components, and so reduced-motion is honoured in one place: @vueuse/motion does
// NOT auto-respect prefers-reduced-motion (unlike the CSS guard in main.css), so
// pages pass useReducedMotion() in and the factory collapses to an instant show.

export const MOTION_DURATION = { fast: 120, base: 220, slow: 320 } as const;

// cubic-bezier(0.2, 0, 0, 1) — matches --ease-standard.
export const EASE_STANDARD: number[] = [0.2, 0, 0, 1];

// Per-item entrance delay (ms) for list stagger; capped so long lists don't crawl.
export function motionStagger(index: number, step = 60, max = 360): number {
  return Math.min(index * step, max);
}

// Fade-up entrance with optional stagger. `reduced` (from useReducedMotion()) skips
// the motion entirely: the element starts and stays at its final state.
export function motionFadeUp(index = 0, reduced = false) {
  if (reduced) {
    return { initial: { opacity: 1, y: 0 }, visibleOnce: { opacity: 1, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 12 },
    visibleOnce: {
      opacity: 1,
      y: 0,
      transition: {
        duration: MOTION_DURATION.slow,
        ease: EASE_STANDARD,
        delay: motionStagger(index),
      },
    },
  };
}
