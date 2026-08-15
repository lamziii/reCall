import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Variants } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

export interface RevealProps {
  children: ReactNode
  /** Seconds before the reveal starts. */
  delay?: number
  /** Vertical travel in px. Default 12 — small, Apple-quiet. */
  y?: number
  /** Soft blur-in. On by default; the whole motion is skipped under reduced-motion. */
  blur?: boolean
  className?: string
  as?: 'div' | 'li' | 'span'
}

/**
 * Scroll-triggered reveal: fade + a short rise + a soft blur-off, once per element. This is the one
 * motion vocabulary the whole page shares — no bounce, no overshoot. Skipped entirely under
 * prefers-reduced-motion (content renders complete).
 */
export function Reveal({ children, delay = 0, y = 12, blur = true, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as]

  if (reduce) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-72px' }}
      transition={{ duration: 0.65, ease: EASE, delay }}
    >
      {children}
    </Comp>
  )
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.02 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE } },
}

/** Container whose direct <RevealItem> children reveal in a staggered cascade as it scrolls in. */
export function Stagger({
  children,
  className,
  amount = 0.2,
}: {
  children: ReactNode
  className?: string
  amount?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  )
}

/** A single item inside <Stagger>. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  if (reduce) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }
  return (
    <Comp className={className} variants={itemVariants}>
      {children}
    </Comp>
  )
}
