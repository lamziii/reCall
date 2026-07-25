import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const CLAMP: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

export interface TruncatedContentProps {
  children: ReactNode
  lines?: number
  className?: string
}

/** Show more / show less pattern for long text — transcript blocks, descriptions, notes. */
export function TruncatedContent({ children, lines = 3, className }: TruncatedContentProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className={cn(!expanded && (CLAMP[lines] ?? 'line-clamp-3'))}>{children}</div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="focus-ring self-start rounded text-caption font-medium text-accent transition-fast hover:text-accent-hover"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}
