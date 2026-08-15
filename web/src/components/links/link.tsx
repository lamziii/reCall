import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link as RouterLink } from '@/lib/router-compat'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const linkVariants = cva('focus-ring inline-flex w-fit items-center gap-1 transition-fast rounded-sm', {
  variants: {
    variant: {
      default: 'text-accent hover:text-accent-hover underline-offset-4 hover:underline',
      subtle: 'text-foreground hover:text-accent underline-offset-4',
      standalone: 'text-foreground font-medium hover:text-accent',
      muted: 'text-muted-foreground hover:text-foreground underline-offset-4',
      danger: 'text-danger hover:text-danger-hover underline-offset-4 hover:underline',
    },
    disabled: {
      true: 'pointer-events-none text-disabled-foreground',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', disabled: false },
})

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>, VariantProps<typeof linkVariants> {
  to: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

/** Internal navigation link. Renders react-router's <Link> — use for in-app routes only. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, variant, disabled, leadingIcon, trailingIcon, className, children, ...props }, ref) => {
    return (
      <RouterLink
        ref={ref}
        to={to}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={cn(linkVariants({ variant, disabled }), className)}
        {...props}
      >
        {leadingIcon && <span className="[&>svg]:size-3.5">{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className="[&>svg]:size-3.5">{trailingIcon}</span>}
      </RouterLink>
    )
  },
)
Link.displayName = 'Link'

export interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target'>, VariantProps<typeof linkVariants> {
  href: string
  showIndicator?: boolean
}

/** Leaves the app. Always opens in a new tab with rel="noopener noreferrer" and shows an arrow indicator by default. */
export const ExternalLink = forwardRef<HTMLAnchorElement, ExternalLinkProps>(
  ({ href, variant, showIndicator = true, className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(linkVariants({ variant }), className)}
        {...props}
      >
        {children}
        {showIndicator && <ArrowUpRight className="size-3.5" aria-hidden />}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    )
  },
)
ExternalLink.displayName = 'ExternalLink'

export interface InlineLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}

/** For links embedded inside a sentence of body copy — always underlined, inherits surrounding text size. */
export const InlineLink = forwardRef<HTMLAnchorElement, InlineLinkProps>(({ to, className, children, ...props }, ref) => {
  return (
    <RouterLink
      ref={ref}
      to={to}
      className={cn('focus-ring rounded-sm text-accent underline underline-offset-4 hover:text-accent-hover', className)}
      {...props}
    >
      {children}
    </RouterLink>
  )
})
InlineLink.displayName = 'InlineLink'
