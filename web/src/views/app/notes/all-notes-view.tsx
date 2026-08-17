'use client'

/**
 * /app/notes/all — the optional overview across every note (personal + meeting). Navigation lives in
 * the Notes sidebar; this is the "database" view for scanning/sorting everything at once. Selecting a
 * row returns to the single-note editor. No mock data.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { NotebookText, Star, Video } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { SearchInput } from '@/components/forms/search-input'
import { Select } from '@/components/forms/select'
import { useNotes } from '@/data/notes/use-notes'
import { displayTitle, notePreview, searchNotes, sortNotes, type NoteListItem, type NoteSort } from '@/data/notes/note-model'
import { formatRelativeTime } from '@/data/home/format'
import { itemPath } from './routes'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title' },
]

function relative(ms: number): string {
  try { return formatRelativeTime(new Date(ms).toISOString()) } catch { return '' }
}

export function AllNotesView() {
  const notes = useNotes()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<NoteSort>('updated')

  const folderName = useMemo(() => new Map(notes.folders.map((f) => [f.id, f.name])), [notes.folders])
  const visible = useMemo(() => sortNotes(searchNotes(notes.items, query), sort), [notes.items, query, sort])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h2 font-semibold text-foreground">All notes</h1>
        <p className="text-small text-muted-foreground">Every note — standalone and from meetings — in one place.</p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search notes…" />
        </div>
        <Select aria-label="Sort notes" value={sort} onChange={(e) => setSort(e.target.value as NoteSort)} options={SORT_OPTIONS} size="sm" className="w-full sm:w-48" />
      </div>

      {notes.loading ? (
        <div className="py-16 text-center text-small text-subtle-foreground">Loading notes…</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<NotebookText />} title={query ? 'No notes match your search.' : 'No notes yet.'} description={query ? undefined : 'Create one from the sidebar (⌘N).'} />
      ) : (
        <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
          {visible.map((item) => (
            <Row key={item.id} item={item} folder={item.folderId ? folderName.get(item.folderId) : undefined} onOpen={() => navigate(itemPath(item))} onToggleFavorite={() => notes.toggleFavorite(item)} updated={relative(item.updatedAtMs)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Row({ item, folder, onOpen, onToggleFavorite, updated }: { item: NoteListItem; folder?: string; onOpen: () => void; onToggleFavorite: () => void; updated: string }) {
  const preview = notePreview(item.plainText)
  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 transition-fast first:rounded-t-lg last:rounded-b-lg hover:bg-surface-hover">
      <button type="button" onClick={onOpen} className="focus-ring flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
        <span className="flex w-full items-center gap-2">
          {item.icon && <span className="shrink-0 text-[0.95rem] leading-none">{item.icon}</span>}
          <span className="truncate text-small font-medium text-foreground">{displayTitle(item.title)}</span>
        </span>
        {preview && <span className="line-clamp-1 text-caption text-muted-foreground">{preview}</span>}
      </button>
      <div className="hidden shrink-0 items-center gap-3 text-caption text-subtle-foreground sm:flex">
        <span className={cn('inline-flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5', item.source === 'meeting' && 'text-foreground')}>
          {item.source === 'meeting' ? <Video className="size-3" /> : <NotebookText className="size-3" />}
          {item.source === 'meeting' ? 'Meeting' : 'Personal'}
        </span>
        {folder && <span className="max-w-[8rem] truncate">{folder}</span>}
        <span className="w-24 text-right tabular-nums">{updated}</span>
      </div>
      <button type="button" aria-label={item.favorite ? 'Remove favorite' : 'Add to favorites'} aria-pressed={item.favorite} onClick={onToggleFavorite} className={cn('focus-ring flex size-7 shrink-0 items-center justify-center rounded-md transition-fast hover:bg-surface-hover', item.favorite ? 'text-warning' : 'text-subtle-foreground opacity-0 hover:text-foreground group-hover:opacity-100')}>
        <Star className={cn('size-4', item.favorite && 'fill-warning')} />
      </button>
    </li>
  )
}
