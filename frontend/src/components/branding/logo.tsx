import markLight from '@/assets/branding/recall-mark-dark-mode.webp'
import logoLight from '@/assets/branding/recall-logo-dark-mode.webp'
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
 * Renders the on-dark variant; this app is dark-first with no light theme.
 */
export function Logo({ size = 'md', className, alt = 'Recall' }: LogoProps) {
  return <img src={markLight} alt={alt} className={cn('w-auto shrink-0', SIZE[size], className)} />
}

const WORDMARK_SIZE = {
  sm: 'h-5',
  md: 'h-6',
  lg: 'h-8',
}

export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <img src={logoLight} alt="Recall" className={cn('w-auto shrink-0', WORDMARK_SIZE[size], className)} />
}
