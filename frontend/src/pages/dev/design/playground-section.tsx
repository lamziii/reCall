import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PlaygroundSectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
}

export function PlaygroundSection({ id, title, description, children }: PlaygroundSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-border-subtle py-12 first:pt-0 last:border-b-0">
      <div className="mb-8 flex flex-col gap-1">
        <h2 className="text-h3 font-semibold text-foreground">{title}</h2>
        {description && <p className="max-w-2xl text-small text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-10">{children}</div>
    </section>
  )
}

export function PlaygroundRow({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {label && <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">{label}</span>}
      <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
    </div>
  )
}
