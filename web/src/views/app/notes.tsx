'use client'

/**
 * Notes Hub (/app/notes) — a restrained, Notion-style knowledge space. A narrow secondary nav
 * (All / Personal / Meetings / Favorites + folders) sits beside a compact, scannable note list.
 * Personal + meeting notes are merged by useNotes; clicking a meeting note deep-links to its Session
 * Notes tab (one source of truth). No mock data.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import {
  Check,
  FolderPlus,
  MoreHorizontal,
  NotebookText,
  Pencil,
  Plus,
  Star,
  Trash2,
  Video,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/forms/search-input'
import { Input } from '@/components/forms/input'
import { Select } from '@/components/forms/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/feedback/toast'
import { useNotes } from '@/data/notes/use-notes'
import {
  countByFilter,
  filterNotes,
  notePreview,
  searchNotes,
  sortNotes,
  type NoteFilter,
  type NoteListItem,
  type NoteSort,
} from '@/data/notes/note-model'
import { formatRelativeTime } from '@/data/home/format'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title' },
]

function relative(ms: number): string {
  try {
    return formatRelativeTime(new Date(ms).toISOString())
  } catch {
    return ''
  }
}
function duration(seconds?: number | null): string | null {
  if (!seconds || seconds < 60) return seconds ? `${seconds}s` : null
  return `${Math.round(seconds / 60)} min`
}

/** Serialize the active filter to a stable string key for the nav's active state. */
function filterKey(f: NoteFilter): string {
  return typeof f === 'string' ? f : `folder:${f.folderId}`
}

export function NotesHubPage() {
  const notes = useNotes()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [filter, setFilter] = useState<NoteFilter>('all')
  const [sort, setSort] = useState<NoteSort>('updated')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)

  const counts = useMemo(() => countByFilter(notes.items), [notes.items])
  const folderName = useMemo(() => new Map(notes.folders.map((f) => [f.id, f.name])), [notes.folders])
  const visible = useMemo(
    () => sortNotes(searchNotes(filterNotes(notes.items, filter), query), sort),
    [notes.items, filter, query, sort],
  )

  const activeFolderId = typeof filter === 'object' ? filter.folderId : null

  async function handleNewNote() {
    setCreating(true)
    try {
      const id = await notes.createNote(activeFolderId)
      navigate(`/app/notes/${id}`)
    } catch {
      setCreating(false)
      toast({ title: "Couldn't create the note", variant: 'danger' })
    }
  }

  function openNote(item: NoteListItem) {
    if (item.source === 'meeting' && item.sessionId) navigate(`/app/sessions/${item.sessionId}?tab=notes`)
    else if (item.noteId) navigate(`/app/notes/${item.noteId}`)
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    await notes.createFolder(name)
    setNewFolderName('')
    setNewFolderOpen(false)
  }

  async function handleRename(id: string) {
    const name = renameValue.trim()
    if (name) await notes.renameFolder(id, name)
    setRenamingId(null)
  }

  async function confirmDeleteFolder() {
    if (!deleteFolderId) return
    const id = deleteFolderId
    setDeleteFolderId(null)
    if (typeof filter === 'object' && filter.folderId === id) setFilter('all')
    await notes.deleteFolder(id)
    toast({ title: 'Folder deleted', description: 'Notes in it are now uncategorized.' })
  }

  const navItem = (key: NoteFilter, label: string, count: number, icon?: React.ReactNode) => (
    <button
      key={filterKey(key)}
      type="button"
      onClick={() => setFilter(key)}
      aria-current={filterKey(filter) === filterKey(key) ? 'true' : undefined}
      className={cn(
        'focus-ring flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-small transition-fast',
        filterKey(filter) === filterKey(key) ? 'bg-surface-active font-medium text-foreground' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {count > 0 && <span className="shrink-0 text-caption text-subtle-foreground tabular-nums">{count}</span>}
    </button>
  )

  const secondaryNav = (
    <nav aria-label="Notes filters" className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        {navItem('all', 'All Notes', counts.all)}
        {navItem('personal', 'Personal', counts.personal)}
        {navItem('meetings', 'Meetings', counts.meetings)}
        {navItem('favorites', 'Favorites', counts.favorites)}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="px-2 pb-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">Folders</span>
        {notes.folders.map((f) =>
          renamingId === f.id ? (
            <Input
              key={f.id}
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRename(f.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(f.id)
                if (e.key === 'Escape') setRenamingId(null)
              }}
              className="h-8"
            />
          ) : (
            <div key={f.id} className="group flex items-center gap-1">
              <div className="min-w-0 flex-1">{navItem({ folderId: f.id }, f.name, notes.items.filter((i) => i.folderId === f.id).length)}</div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button
                    type="button"
                    aria-label={`${f.name} options`}
                    className="focus-ring flex size-6 shrink-0 items-center justify-center rounded text-subtle-foreground opacity-0 transition-fast hover:text-foreground group-hover:opacity-100 [&>svg]:size-3.5"
                  >
                    <MoreHorizontal />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent width={160} placement="right">
                  <DropdownMenuItem icon={<Pencil />} onSelect={() => { setRenamingId(f.id); setRenameValue(f.name) }}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => setDeleteFolderId(f.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        )}

        {newFolderOpen ? (
          <Input
            autoFocus
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={handleCreateFolder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setNewFolderOpen(false); setNewFolderName('') }
            }}
            className="mt-1 h-8"
          />
        ) : (
          <button
            type="button"
            onClick={() => setNewFolderOpen(true)}
            className="focus-ring mt-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-small text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground"
          >
            <FolderPlus className="size-4" /> New folder
          </button>
        )}
      </div>
    </nav>
  )

  // Mobile: filter + folder as a single Select instead of the side rail.
  const mobileFilterOptions = [
    { value: 'all', label: `All Notes (${counts.all})` },
    { value: 'personal', label: `Personal (${counts.personal})` },
    { value: 'meetings', label: `Meetings (${counts.meetings})` },
    { value: 'favorites', label: `Favorites (${counts.favorites})` },
    ...notes.folders.map((f) => ({ value: `folder:${f.id}`, label: f.name })),
  ]

  return (
    <PageContainer>
      <div className="flex flex-col gap-1 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-semibold text-foreground">Notes</h1>
          <p className="text-small text-muted-foreground">All your notes — standalone and from meetings — in one place.</p>
        </div>
        <Button leftIcon={<Plus />} onClick={handleNewNote} loading={creating} className="w-fit">
          New note
        </Button>
      </div>

      <div className="mb-4 md:hidden">
        <Select
          aria-label="Notes filter"
          value={filterKey(filter)}
          onChange={(e) => {
            const v = e.target.value
            setFilter(v.startsWith('folder:') ? { folderId: v.slice(7) } : (v as NoteFilter))
          }}
          options={mobileFilterOptions}
        />
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-52 shrink-0 md:block">{secondaryNav}</aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search notes…" />
            </div>
            <Select aria-label="Sort notes" value={sort} onChange={(e) => setSort(e.target.value as NoteSort)} options={SORT_OPTIONS} size="sm" className="w-full sm:w-48" />
          </div>

          {notes.loading ? (
            <div className="py-16 text-center text-small text-subtle-foreground">Loading notes…</div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<NotebookText />}
              title={query ? 'No notes match your search.' : typeof filter === 'object' ? 'No notes in this folder yet.' : 'Your notes will live here.'}
              description={query ? undefined : 'Meeting notes will appear here automatically.'}
              action={<Button variant="secondary" leftIcon={<Plus />} onClick={handleNewNote} loading={creating}>New note</Button>}
            />
          ) : (
            <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
              {visible.map((item) => (
                <NoteRow
                  key={item.id}
                  item={item}
                  folderName={item.folderId ? folderName.get(item.folderId) : undefined}
                  folders={notes.folders}
                  onOpen={() => openNote(item)}
                  onToggleFavorite={() => notes.toggleFavorite(item)}
                  onMove={(fid) => notes.moveToFolder(item, fid)}
                  onDelete={item.source === 'personal' ? () => notes.deleteNote(item) : undefined}
                  durationLabel={duration(item.sessionDurationSeconds)}
                  updatedLabel={relative(item.updatedAtMs)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteFolderId !== null}
        onOpenChange={(o) => !o && setDeleteFolderId(null)}
        title="Delete this folder?"
        description="The folder will be removed. Notes inside it are kept and become uncategorized."
        confirmLabel="Delete folder"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteFolder}
      />
    </PageContainer>
  )
}

function NoteRow({
  item,
  folderName,
  folders,
  onOpen,
  onToggleFavorite,
  onMove,
  onDelete,
  durationLabel,
  updatedLabel,
}: {
  item: NoteListItem
  folderName?: string
  folders: { id: string; name: string }[]
  onOpen: () => void
  onToggleFavorite: () => void
  onMove: (folderId: string | null) => void
  onDelete?: () => void
  durationLabel: string | null
  updatedLabel: string
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const preview = notePreview(item.plainText)
  return (
    <li className="group relative flex items-center gap-3 px-3 py-2.5 transition-fast first:rounded-t-lg last:rounded-b-lg hover:bg-surface-hover">
      <button type="button" onClick={onOpen} className="focus-ring flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
        <span className="flex w-full items-center gap-2">
          <span className="truncate text-small font-medium text-foreground">{item.title}</span>
          {item.favorite && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Favorite" />}
        </span>
        {preview && <span className="line-clamp-1 text-caption text-muted-foreground">{preview}</span>}
      </button>

      <div className="hidden shrink-0 items-center gap-3 text-caption text-subtle-foreground sm:flex">
        <span className={cn('inline-flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5', item.source === 'meeting' && 'text-foreground')}>
          {item.source === 'meeting' ? <Video className="size-3" /> : <NotebookText className="size-3" />}
          {item.source === 'meeting' ? 'Meeting' : 'Personal'}
        </span>
        {folderName && <span className="max-w-[8rem] truncate">{folderName}</span>}
        {durationLabel && <span className="tabular-nums">{durationLabel}</span>}
        <span className="w-28 text-right tabular-nums">{updatedLabel}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <button
            type="button"
            aria-label={`${item.title} options`}
            className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-md text-subtle-foreground opacity-0 transition-fast hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 [&>svg]:size-4"
          >
            <MoreHorizontal />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent width={200} placement="bottom-end">
          <DropdownMenuItem icon={<Star />} onSelect={onToggleFavorite}>
            {item.favorite ? 'Remove favorite' : 'Add to favorites'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
          <DropdownMenuItem icon={item.folderId === null ? <Check /> : undefined} onSelect={() => onMove(null)}>
            Uncategorized
          </DropdownMenuItem>
          {folders.map((f) => (
            <DropdownMenuItem key={f.id} icon={item.folderId === f.id ? <Check /> : undefined} onSelect={() => onMove(f.id)}>
              {f.name}
            </DropdownMenuItem>
          ))}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => setConfirmDelete(true)}>
                Delete note
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete this note?"
          description="This permanently deletes the note. This can't be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={onDelete}
        />
      )}
    </li>
  )
}
