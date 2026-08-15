import markLight from '@/assets/branding/recall-mark-dark-mode.webp'
import markBlack from '@/assets/branding/recall-icon-black.png'
import logoLight from '@/assets/branding/recall-logo-dark-mode.webp'
import { useTheme } from '@/app/theme/theme-provider'
import { cn } from '@/lib/utils'

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  alt?: string
}

const SIZE = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
}

/**
 * Canonical Recall mark — official asset (see src/assets/branding/README.md).
 * Theme-aware: white mark on dark surfaces, black mark on light surfaces
 * (only place this matters today is the /app sidebar — every other surface
 * that renders this stays forced-dark).
 */
export function Logo({ size = 'md', className, alt = 'Recall' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  return (
    <img
      src={(resolvedTheme === 'light' ? markBlack : markLight).src}
      alt={alt}
      className={cn('w-auto shrink-0', SIZE[size], className)}
    />
  )
}

const WORDMARK_SIZE = {
  sm: 'h-5',
  md: 'h-6',
  lg: 'h-8',
}

export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <img src={logoLight.src} alt="Recall" className={cn('w-auto shrink-0', WORDMARK_SIZE[size], className)} />
}
