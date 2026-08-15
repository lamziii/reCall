import { cn } from '@/lib/utils'

/** Subtle step dots — the active one is a short accent pill, the rest muted (spec §18). */
export function OnboardingProgress({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-200',
            i === current ? 'w-5 bg-foreground' : 'w-1.5 bg-border-strong',
          )}
        />
      ))}
    </div>
  )
}
