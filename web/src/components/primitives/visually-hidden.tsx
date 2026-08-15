import type { AnchorHTMLAttributes, ElementType, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement>, Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> {
  focusable?: boolean
  as?: ElementType
}

/**
 * Screen-reader-only content. Set `focusable` for skip-links that should
 * appear on keyboard focus — pass `as="a"` (with `href`) so the rendered
 * element is natively focusable; a plain `<span>` never receives `:focus`.
 */
export function VisuallyHidden({ focusable, as: Tag = 'span', className, ...props }: VisuallyHiddenProps) {
  return (
    <Tag
      className={cn(
        focusable
          ? 'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-small focus:text-accent-foreground'
          : 'sr-only',
        className,
      )}
      {...props}
    />
  )
}
