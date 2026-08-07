import type { ReactNode } from 'react'
import { Container } from '@/components/layout/container'
import { BodyLarge, Label } from '@/components/typography'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'

export interface SectionShellProps {
  id?: string
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  /** Container width — defaults to the page width shared with the hero. */
  width?: 'content' | 'page' | 'wide'
  children?: ReactNode
  className?: string
  /** Extra spacing between the header block and children. */
  bodyClassName?: string
}

/**
 * Shared marketing section: eyebrow label + heading + lede, consistent vertical
 * rhythm and scroll-reveal. Every homepage section renders through this so
 * spacing and typography stay identical across the page (per the brief:
 * "Maintain consistent spacing", "Prefer reusable primitives").
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
    <section id={id} className={cn('scroll-mt-24 py-24 sm:py-32', className)}>
      <Container width={width}>
        <div className={cn('flex flex-col', centered ? 'items-center text-center' : 'items-start')}>
          {eyebrow && (
            <Reveal>
              <Label as="span" className="mb-4 block text-subtle-foreground">
                {eyebrow}
              </Label>
            </Reveal>
          )}
          <Reveal delay={0.06}>
            <h2 className="max-w-[20ch] text-[clamp(1.875rem,1.3rem+2.2vw,3rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
              {title}
            </h2>
          </Reveal>
          {description && (
            <Reveal delay={0.12}>
              <BodyLarge className={cn('mt-5 max-w-[46ch] text-muted-foreground', centered && 'mx-auto')}>
                {description}
              </BodyLarge>
            </Reveal>
          )}
        </div>

        {children && <div className={cn('mt-14 sm:mt-16', bodyClassName)}>{children}</div>}
      </Container>
    </section>
  )
}
