import { Search } from 'lucide-react'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { cn } from '@/lib/utils'

export interface SearchTriggerProps {
  onClick: () => void
  className?: string
}

/** Raycast-style search affordance — opens the command palette rather than searching inline. */
export function SearchTrigger({ onClick, className }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-ring flex w-full max-w-sm items-center gap-2.5 rounded-full border border-border-subtle bg-surface px-3.5 py-2 text-left transition-fast',
        'hover:border-border-strong focus-visible:border-accent',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
      <span className="flex-1 truncate text-small text-subtle-foreground">Search Recall...</span>
      <KeyboardShortcut keys={['⌘', 'K']} />
    </button>
  )
}
