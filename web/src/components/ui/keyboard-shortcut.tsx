import { cn } from '@/lib/utils'

export interface KeyboardShortcutProps {
  keys: string[]
  /** 'sm' for inline row hints (menus, list rows); 'md' (default) for prominent controls like the
   *  command palette / search trigger. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Renders a shortcut as deliberate key-caps, e.g. keys={['⌘', 'K']} → ⌘ K. One shared component so
 * every badge across the app (command palette, search trigger, list-row hints) is sized and styled
 * consistently in both themes. `md` targets ~30px caps; `sm` is the compact inline variant.
 */
export function KeyboardShortcut({ keys, size = 'md', className }: KeyboardShortcutProps) {
  const cap =
    size === 'md'
      ? 'h-[1.875rem] min-w-[1.875rem] px-2 text-small'
      : 'h-[1.375rem] min-w-[1.375rem] px-1.5 text-caption'
  return (
    <kbd className={cn('inline-flex items-center gap-1 font-sans', className)}>
      {keys.map((key, index) => (
        <span
          key={index}
          className={cn(
            'inline-flex select-none items-center justify-center rounded-md border border-border-subtle bg-surface-raised font-medium leading-none text-muted-foreground',
            cap,
          )}
        >
          {key}
        </span>
      ))}
    </kbd>
  )
}
