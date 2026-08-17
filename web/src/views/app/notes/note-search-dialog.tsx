'use client'

/**
 * Notes quick-open (⌘P). A lightweight in-place search over the already-loaded notes — title + plain
 * text, folders and meeting titles included (searchNotes) — that opens the chosen note straight into
 * the editor. Deliberately not a full search page (YAGNI); results are the workspace's own notes.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { NotebookText, Video } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SearchInput } from '@/components/forms/search-input'
import { displayTitle, notePreview, searchNotes, sortNotes, type NoteListItem } from '@/data/notes/note-model'
import { cn } from '@/lib/utils'

export function NoteSearchDialog({
  open,
  onOpenChange,
  items,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NoteListItem[]
  onSelect: (item: NoteListItem) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Focus after the dialog mounts.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const results = useMemo(() => sortNotes(searchNotes(items, query), 'updated').slice(0, 30), [items, query])
  useEffect(() => setActive(0), [query])

  function choose(item: NoteListItem | undefined) {
    if (!item) return
    onOpenChange(false)
    onSelect(item)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="w-[min(36rem,92vw)] overflow-hidden p-0">
        <div className="border-b border-border-subtle p-2">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            placeholder="Search notes…"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]) }
            }}
          />
        </div>
        <ul className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-small text-subtle-foreground">{query ? 'No matching notes.' : 'Type to search your notes.'}</li>
          ) : (
            results.map((item, i) => {
              const preview = notePreview(item.plainText)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-fast', i === active ? 'bg-surface-active' : 'hover:bg-surface-hover')}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center text-subtle-foreground [&>svg]:size-4">
                      {item.icon ? <span className="text-[1rem] leading-none">{item.icon}</span> : item.source === 'meeting' ? <Video /> : <NotebookText />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-small font-medium text-foreground">{displayTitle(item.title)}</span>
                      {preview && <span className="truncate text-caption text-muted-foreground">{preview}</span>}
                    </span>
                    {item.source === 'meeting' && <span className="shrink-0 text-caption text-subtle-foreground">Meeting</span>}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
