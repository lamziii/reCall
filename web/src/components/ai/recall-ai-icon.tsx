import { MessageSquare, Sparkle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Temporary Recall AI mark: a squared-off message icon with a small sparkle in the corner.
 * Monochrome, inherits currentColor, and matches the ~18px / 1.75 stroke weight of the other
 * toolbar icons. No robot, no gradient, no badge — a placeholder until a bespoke mark is designed.
 */
export function RecallAiIcon({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex size-[18px] items-center justify-center', className)} aria-hidden>
      <MessageSquare className="size-[18px]" strokeWidth={1.75} />
      <Sparkle className="absolute -right-[3px] -top-[3px] size-[9px] fill-current" strokeWidth={1.75} />
    </span>
  )
}
