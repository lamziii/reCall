import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SearchShell } from '@/components/ui/search-shell'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

export interface CommandItem {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string[]
  group?: string
  onSelect: () => void
}

export interface CommandPaletteProps {
  items: CommandItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
}

/** Global Cmd/Ctrl+K palette. Mount once near the app root. */
export function CommandPalette({ items, open, onOpenChange, placeholder = 'Type a command or search...' }: CommandPaletteProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: false, onChange: onOpenChange })
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!isOpen)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, setOpen])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [isOpen])

  const filtered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const key = item.group ?? ''
    ;(acc[key] ??= []).push(item)
    return acc
  }, {})

  function runItem(item: CommandItem) {
    item.onSelect()
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filtered[activeIndex]) runItem(filtered[activeIndex])
    }
  }

  return (
    <SearchShell open={isOpen} onOpenChange={setOpen} query={query} onQueryChange={setQuery} onKeyDown={onKeyDown} placeholder={placeholder}>
      {filtered.length === 0 && <div className="px-3 py-8 text-center text-small text-subtle-foreground">No results</div>}
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group || 'ungrouped'} className="mb-2 last:mb-0">
          {group && <div className="px-2.5 py-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">{group}</div>}
          {groupItems.map((item) => {
            const globalIndex = filtered.indexOf(item)
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveIndex(globalIndex)}
                onClick={() => runItem(item)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small text-foreground',
                  globalIndex === activeIndex && 'bg-surface-hover',
                )}
              >
                {item.icon && <span className="shrink-0 text-subtle-foreground [&>svg]:size-4">{item.icon}</span>}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && <KeyboardShortcut keys={item.shortcut} />}
              </button>
            )
          })}
        </div>
      ))}
    </SearchShell>
  )
}
