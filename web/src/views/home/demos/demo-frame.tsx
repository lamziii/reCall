import type { ReactNode } from 'react'
import { LayoutGrid, ListChecks, Mic, FolderKanban, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const RAIL_ICONS = [
  { icon: LayoutGrid, active: false },
  { icon: Mic, active: true },
  { icon: ListChecks, active: false },
  { icon: FolderKanban, active: false },
  { icon: MessageSquare, active: false },
]

export interface DemoFrameProps {
  /** Right side of the top bar — status, timer, avatars. */
  topbar: ReactNode
  /** The session title shown top-left. */
  title: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The Recall app surface, reproduced with the real design tokens (not a browser/laptop mockup): a
 * slim nav rail, a top bar, and a content area — so an embedded demo reads as a piece of the actual
 * product. The rail collapses away below `sm` to keep the content readable on phones.
 */
export function DemoFrame({ topbar, title, children, className }: DemoFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-bg shadow-[0_24px_70px_-24px_rgba(0,0,0,0.6)]',
        className,
      )}
    >
      <div className="flex">
        {/* Nav rail — presentational; recreates the app's collapsed sidebar. */}
        <div aria-hidden className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-surface py-3 sm:flex">
          <span className="mb-2 size-5 rounded-md bg-accent" />
          {RAIL_ICONS.map(({ icon: Icon, active }, i) => (
            <span
              key={i}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                active ? 'bg-surface-selected text-foreground' : 'text-subtle-foreground',
              )}
            >
              <Icon className="size-[17px]" />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <div className="flex h-12 items-center justify-between gap-3 border-b border-border-subtle px-4">
            <span className="truncate text-small font-semibold text-foreground">{title}</span>
            <div className="flex shrink-0 items-center gap-2.5">{topbar}</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
