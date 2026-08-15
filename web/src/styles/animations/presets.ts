import type { Transition, Variants } from 'framer-motion'

/**
 * Shared Framer Motion presets. Everything is fast and subtle — no bounce,
 * no springs with overshoot. Mirrors styles/tokens/motion.css durations.
 */

export const EASE_STANDARD: Transition['ease'] = [0.16, 1, 0.3, 1]
export const EASE_IN: Transition['ease'] = [0.4, 0, 1, 1]
export const EASE_OUT: Transition['ease'] = [0, 0, 0.2, 1]

export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.32,
} as const

export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
}

export const slideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, y: 8, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
}

export const slideDown: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
}

export const slideFromRight: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, x: 12, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: DURATION.instant, ease: EASE_STANDARD } },
}

export const dialogContent: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_STANDARD } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
}

/** Apply to a parent; children should use `staggerItem`. */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
}

/** Spread onto interactive elements for a consistent hover/tap micro-interaction. */
export const hoverLift = {
  whileHover: { y: -1, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
  whileTap: { y: 0, scale: 0.99 },
}

export const listItem: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, height: 0, transition: { duration: DURATION.fast, ease: EASE_STANDARD } },
}
