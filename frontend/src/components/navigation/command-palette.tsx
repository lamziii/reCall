import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Sparkles, CornerDownLeft } from 'lucide-react'
import { SearchShell } from '@/components/ui/search-shell'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

export interface CommandItem {
  id: string
  label: string
  /** Optional secondary line — also matched by the query. */
  sublabel?: string
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
  /** When provided, the palette can route a query to Recall AI (via /ai, /ask, or the Ask-AI item). */
  onAskAi?: (query: string) => void
}

/** Strips a leading /ai or /ask command; returns the AI query, or null when the input isn't one. */
function parseAiCommand(raw: string): string | null {
  const m = raw.match(/^\/(ai|ask)\b\s*(.*)$/i)
  return m ? m[2] : null
}

/** Global Cmd/Ctrl+K palette. Searches workspace content + navigation, and can ask Recall AI. */
export function CommandPalette({ items, open, onOpenChange, placeholder = 'Search Recall, or type /ai to ask…', onAskAi }: CommandPaletteProps) {
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

  const trimmed = query.trim()
  const aiCommand = parseAiCommand(trimmed) // '' means "/ai" with no text yet; null means not a command

  // The AI action item, shown first for an explicit /ai command, or appended as an escalation.
  const askItem = useMemo<CommandItem | null>(() => {
    if (!onAskAi) return null
    const q = aiCommand !== null ? aiCommand : trimmed
    if (aiCommand === null && q.length === 0) return null // don't show a bare "Ask AI" with nothing typed
    return {
      id: '__ask_ai__',
      label: q ? `Ask Recall AI` : 'Ask Recall AI…',
      sublabel: q || 'Type your question',
      group: 'Recall AI',
      icon: <Sparkles />,
      onSelect: () => onAskAi(q),
    }
  }, [onAskAi, aiCommand, trimmed])

  const filtered = useMemo<CommandItem[]>(() => {
    if (aiCommand !== null) return askItem ? [askItem] : [] // /ai mode: ONLY the AI action
    const q = trimmed.toLowerCase()
    const matches = q
      ? items.filter((i) => i.label.toLowerCase().includes(q) || i.sublabel?.toLowerCase().includes(q))
      : items
    return askItem ? [...matches, askItem] : matches
  }, [aiCommand, askItem, items, trimmed])

  // Reset the highlight to the top whenever the result set changes.
  useEffect(() => setActiveIndex(0), [query])

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
      {filtered.length === 0 && (
        <div className="px-3 py-8 text-center text-small text-subtle-foreground">
          {onAskAi ? 'No matches. Type /ai to ask Recall AI.' : 'No results'}
        </div>
      )}
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group || 'ungrouped'} className="mb-2 last:mb-0">
          {group && <div className="px-2.5 py-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">{group}</div>}
          {groupItems.map((item) => {
            const globalIndex = filtered.indexOf(item)
            const active = globalIndex === activeIndex
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveIndex(globalIndex)}
                onClick={() => runItem(item)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-small text-foreground',
                  active && 'bg-surface-hover',
                )}
              >
                {item.icon && <span className="shrink-0 text-subtle-foreground [&>svg]:size-4">{item.icon}</span>}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{item.label}</span>
                  {item.sublabel && <span className="truncate text-caption text-subtle-foreground">{item.sublabel}</span>}
                </span>
                {item.shortcut && <KeyboardShortcut keys={item.shortcut} />}
                {active && !item.shortcut && <CornerDownLeft className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />}
              </button>
            )
          })}
        </div>
      ))}
    </SearchShell>
  )
}
