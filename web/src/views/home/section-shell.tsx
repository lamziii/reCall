import type { ReactNode } from 'react'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'

export interface SectionShellProps {
  id?: string
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  width?: 'content' | 'page' | 'wide'
  children?: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Shared marketing section. Owns the page's vertical rhythm (a single ~160px cadence between
 * sections) and the Apple-quiet header: a small accent eyebrow, a restrained headline, and at most
 * one short supporting line. Every section renders through this so spacing and type never drift.
 */
export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  width = 'page',
  children,
  className,
  bodyClassName,
}: SectionShellProps) {
  const centered = align === 'center'
  return (
    <section id={id} className={cn('scroll-mt-24 py-16 sm:py-20 lg:py-24', className)}>
      <Container width={width}>
        <div className={cn('flex flex-col', centered ? 'items-center text-center' : 'items-start')}>
          {eyebrow && (
            <Reveal className="mb-5">
              <span className="inline-flex items-center gap-2 text-caption font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                <span className="size-1 rounded-full bg-accent" aria-hidden />
                {eyebrow}
              </span>
            </Reveal>
          )}
          <Reveal delay={0.05}>
            <h2 className="max-w-[18ch] text-balance text-[clamp(1.625rem,1.2rem+1.6vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground">
              {title}
            </h2>
          </Reveal>
          {description && (
            <Reveal delay={0.1}>
              <p className={cn('mt-4 max-w-[42ch] text-body-lg leading-relaxed text-muted-foreground', centered && 'mx-auto')}>
                {description}
              </p>
            </Reveal>
          )}
        </div>

        {children && <div className={cn('mt-14 sm:mt-16', bodyClassName)}>{children}</div>}
      </Container>
    </section>
  )
}
