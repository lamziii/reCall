import { DURATION, EASE_STANDARD } from '@/styles/animations/presets'

export const homeContainerVariants = { initial: {}, animate: { transition: { staggerChildren: 0.07 } } }

export const homeItemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
}
