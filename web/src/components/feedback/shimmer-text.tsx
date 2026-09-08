import { cn } from '@/lib/utils'

/**
 * A live "working" shimmer over muted text — Recall's shared motion language for AI / processing
 * states ("Organizing this session…", "Transcribing…"). Pure CSS (see animations/keyframes.css);
 * honors reduced motion via the global data-reduce-motion block + the OS guard in that stylesheet.
 *
 * `children` must be a plain string — it's mirrored into `data-text` so the ::before layer can clip
 * the sweep onto the same glyphs.
 */
export function ShimmerText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn('t-shimmer', className)} data-text={children}>
      {children}
    </span>
  )
}
