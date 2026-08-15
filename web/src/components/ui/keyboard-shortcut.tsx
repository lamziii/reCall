import { cn } from '@/lib/utils'

export interface KeyboardShortcutProps {
  keys: string[]
  className?: string
}

/** Renders a shortcut as individual key caps, e.g. keys={['⌘', 'K']}. */
export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  return (
    <kbd className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <span
          key={index}
          className="flex min-w-[1.25rem] items-center justify-center rounded border border-border-strong bg-surface-active px-1.5 py-0.5 text-caption font-medium text-muted-foreground"
        >
          {key}
        </span>
      ))}
    </kbd>
  )
}
