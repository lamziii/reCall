import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SearchShell } from '@/components/ui/search-shell'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

export interface SearchResult {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  group?: string
}

export interface SearchOverlayProps {
  results: SearchResult[]
  query: string
  onQueryChange: (query: string) => void
  onSelect: (result: SearchResult) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
}

/** Global content search (sessions, projects, tasks, ...). Triggered externally — e.g. a Header search button. */
export function SearchOverlay({ results, query, onQueryChange, onSelect, open, onOpenChange, placeholder = 'Search Recall...' }: SearchOverlayProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: false, onChange: onOpenChange })
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => setActiveIndex(0), [results])

  function pick(result: SearchResult) {
    onSelect(result)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (results[activeIndex]) pick(results[activeIndex])
    }
  }

  return (
    <SearchShell open={isOpen} onOpenChange={setOpen} query={query} onQueryChange={onQueryChange} onKeyDown={onKeyDown} placeholder={placeholder}>
      {results.length === 0 && <div className="px-3 py-8 text-center text-small text-subtle-foreground">No results</div>}
      {results.map((result, index) => (
        <button
          key={result.id}
          type="button"
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => pick(result)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left',
            index === activeIndex && 'bg-surface-hover',
          )}
        >
          {result.icon && <span className="shrink-0 text-subtle-foreground [&>svg]:size-4">{result.icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small text-foreground">{result.title}</span>
            {result.description && <span className="block truncate text-caption text-muted-foreground">{result.description}</span>}
          </span>
        </button>
      ))}
    </SearchShell>
  )
}
