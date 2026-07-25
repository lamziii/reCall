import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface QuoteProps {
  children: ReactNode
  attribution?: string
  role?: string
  className?: string
}

/** For transcript excerpts and customer quotes. */
export function Quote({ children, attribution, role, className }: QuoteProps) {
  return (
    <blockquote className={cn('border-l-2 border-border-accent pl-4', className)}>
      <p className="text-body italic text-foreground">&ldquo;{children}&rdquo;</p>
      {(attribution || role) && (
        <footer className="mt-2 text-small text-muted-foreground">
          {attribution}
          {role && <span className="text-subtle-foreground"> · {role}</span>}
        </footer>
      )}
    </blockquote>
  )
}
