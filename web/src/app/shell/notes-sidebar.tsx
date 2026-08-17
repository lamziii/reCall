'use client'

/**
 * NotesSidebar — the dedicated left rail that REPLACES the global Recall sidebar while the user is in
 * /app/notes (see RecallShell). It is the whole navigation model for the Notes sub-product: back to
 * Recall, search, new note, favorites, the folder/note tree, meeting notes, and Trash. The right
 * column (the routed page) is always the active note editor, so selecting here swaps the editor there.
 *
 * Ordering + nesting come from the pure helpers in note-model (buildFolderTree / notesInFolder /
 * reorderIds); this component only renders them and wires actions to useNotes. Drag is a progressive
 * enhancement over the always-present context-menu "Move" — dropping a note on a folder moves it,
 * dropping on a sibling note reorders within that folder. Meeting notes are never draggable (their
 * content isn't ours to reorder).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@/lib/router-compat'
import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FolderPlus,
  MoreHorizontal,
  NotebookText,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Video,
  ArrowLeft,
  PanelLeftClose,
  Check,
} from 'lucide-react'
import { useNotes } from '@/data/notes/use-notes'
import {
  buildFolderTree,
  displayTitle,
  notesInFolder,
  reorderIds,
  type FolderNode,
  type NoteListItem,
} from '@/data/notes/note-model'
import { Input } from '@/components/forms/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/feedback/toast'
import { APP_BASE } from './nav-config'
import { NOTES_TRASH, itemPath } from '@/views/app/notes/routes'
import { NoteSearchDialog } from '@/views/app/notes/note-search-dialog'
import { cn } from '@/lib/utils'

const EXPANDED_KEY = 'recall:notes-expanded-folders'

/** Reads the persisted set of expanded folder ids (best-effort). */
function loadExpanded(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY) || '[]') as string[])
  } catch {
    return new Set()
  }
}

export interface NotesSidebarProps {
  onCollapse?: () => void
}

export function NotesSidebar({ onCollapse }: NotesSidebarProps) {
  const notes = useNotes()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [searchOpen, setSearchOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [creatingFolderParent, setCreatingFolderParent] = useState<string | null | undefined>(undefined) // undefined = closed
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)
  const dragItem = useRef<NoteListItem | null>(null)

  useEffect(() => setExpanded(loadExpanded()), [])
  const persistExpanded = (next: Set<string>) => {
    setExpanded(next)
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify([...next]))
    } catch {
      /* storage full/blocked — expansion is non-essential */
    }
  }
  const toggleFolder = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    persistExpanded(next)
  }

  const tree = useMemo(() => buildFolderTree(notes.folders), [notes.folders])
  const favorites = useMemo(() => notes.items.filter((i) => i.favorite), [notes.items])
  const meetings = useMemo(
    () => notes.items.filter((i) => i.source === 'meeting').sort((a, b) => b.updatedAtMs - a.updatedAtMs),
    [notes.items],
  )
  const rootNotes = useMemo(() => notesInFolder(notes.items, null), [notes.items])

  const activePath = location.pathname

  // Keyboard: ⌘/Ctrl+N new note, ⌘/Ctrl+P quick-open. Bound at the sidebar (owns both surfaces).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 'p') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (k === 'n' && !e.shiftKey) {
        e.preventDefault()
        void handleNewNote(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // no deps: handlers read fresh state via closures recreated each render

  async function handleNewNote(folderId: string | null) {
    try {
      const id = await notes.createNote(folderId)
      if (folderId) persistExpanded(new Set(expanded).add(folderId))
      navigate(`/app/notes/${id}`)
    } catch {
      toast({ title: "Couldn't create the note", variant: 'danger' })
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    const parent = creatingFolderParent
    setCreatingFolderParent(undefined)
    setNewFolderName('')
    if (!name || parent === undefined) return
    await notes.createFolder(name, parent)
    if (parent) persistExpanded(new Set(expanded).add(parent))
  }

  async function handleRename(id: string) {
    const name = renameValue.trim()
    setRenamingId(null)
    if (name) await notes.updateFolder(id, { name })
  }

  async function confirmDeleteFolder() {
    if (!deleteFolderId) return
    const id = deleteFolderId
    setDeleteFolderId(null)
    await notes.deleteFolder(id)
    toast({ title: 'Folder deleted', description: 'Its notes are now uncategorized.' })
  }

  // ---- drag/drop (personal notes only) -----------------------------------------------------------
  function onDropInFolder(folderId: string | null) {
    const item = dragItem.current
    dragItem.current = null
    if (item && item.source === 'personal' && item.folderId !== folderId) void notes.moveToFolder(item, folderId)
  }
  function onReorderOnto(target: NoteListItem) {
    const item = dragItem.current
    dragItem.current = null
    if (!item || item.source !== 'personal' || item.id === target.id) return
    if (item.folderId !== target.folderId) {
      // Different folder → treat as a move into the target's folder.
      void notes.moveToFolder(item, target.folderId)
      return
    }
    const siblings = notesInFolder(notes.items, target.folderId).map((i) => i.noteId!).filter(Boolean)
    const toIndex = siblings.indexOf(target.noteId!)
    void notes.persistOrder(reorderIds(siblings, item.noteId!, toIndex))
  }

  const railBtn = 'focus-ring flex items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground'

  return (
    <aside
      style={{ width: '17.5rem' }}
      className="flex h-full min-h-0 flex-col border-r border-border-subtle bg-surface"
    >
      {/* Back to Recall + collapse */}
      <div className="flex h-[var(--header-height)] shrink-0 items-center gap-1 px-2">
        <button
          type="button"
          onClick={() => navigate(APP_BASE)}
          className={cn(railBtn, 'h-8 min-w-0 flex-1 justify-start gap-2 px-2 text-small font-medium')}
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="truncate">Back to Recall</span>
        </button>
        {onCollapse && (
          <button type="button" onClick={onCollapse} aria-label="Collapse notes sidebar" className={cn(railBtn, 'size-8')}>
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {/* Search + New note */}
      <div className="flex flex-col gap-0.5 px-2 pb-1">
        <button type="button" onClick={() => setSearchOpen(true)} className={cn(railBtn, 'h-8 justify-start gap-2 px-2 text-small')}>
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <KeyboardShortcut keys={['⌘', 'P']} size="sm" />
        </button>
        <button
          type="button"
          onClick={() => handleNewNote(null)}
          className="focus-ring flex h-8 items-center gap-2 rounded-md px-2 text-left text-small font-medium text-foreground transition-fast hover:bg-surface-hover"
        >
          <Plus className="size-4 shrink-0 text-subtle-foreground" />
          <span className="flex-1">New note</span>
          <KeyboardShortcut keys={['⌘', 'N']} size="sm" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {/* Favorites */}
        {favorites.length > 0 && (
          <Section label="Favorites">
            {favorites.map((item) => (
              <NoteLeaf
                key={`fav-${item.id}`}
                item={item}
                depth={0}
                active={activePath === itemPath(item)}
                onOpen={() => navigate(itemPath(item))}
                notes={notes}
                dragItem={dragItem}
                onReorderOnto={onReorderOnto}
              />
            ))}
          </Section>
        )}

        {/* Folder / note tree */}
        <Section
          label="Notes"
          onDrop={() => onDropInFolder(null)}
          action={
            <div className="flex items-center gap-0.5">
              <button type="button" aria-label="New folder" title="New folder" onClick={() => { setCreatingFolderParent(null); setNewFolderName('') }} className={cn(railBtn, 'size-5 [&>svg]:size-3.5')}>
                <FolderPlus />
              </button>
            </div>
          }
        >
          {tree.map((node) => (
            <FolderBranch
              key={node.folder.id}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={toggleFolder}
              notes={notes}
              activePath={activePath}
              navigate={navigate}
              onNewNote={handleNewNote}
              onNewSubfolder={(pid) => { setCreatingFolderParent(pid); setNewFolderName('') }}
              onRename={(id, name) => { setRenamingId(id); setRenameValue(name) }}
              onDelete={setDeleteFolderId}
              renamingId={renamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              commitRename={handleRename}
              cancelRename={() => setRenamingId(null)}
              dragItem={dragItem}
              onDropInFolder={onDropInFolder}
              onReorderOnto={onReorderOnto}
            />
          ))}

          {/* New root folder inline input */}
          {creatingFolderParent === null && (
            <FolderNameInput value={newFolderName} onChange={setNewFolderName} onCommit={handleCreateFolder} onCancel={() => setCreatingFolderParent(undefined)} depth={0} />
          )}

          {/* Uncategorized root notes */}
          {rootNotes.map((item) => (
            <NoteLeaf
              key={item.id}
              item={item}
              depth={0}
              active={activePath === itemPath(item)}
              onOpen={() => navigate(itemPath(item))}
              notes={notes}
              dragItem={dragItem}
              onReorderOnto={onReorderOnto}
            />
          ))}

          {tree.length === 0 && rootNotes.length === 0 && (
            <p className="px-2 py-1.5 text-caption text-subtle-foreground">No notes yet. Press ⌘N to start.</p>
          )}
        </Section>

        {/* Meeting notes */}
        {meetings.length > 0 && (
          <Section label="Meeting Notes">
            {meetings.map((item) => (
              <NoteLeaf
                key={item.id}
                item={item}
                depth={0}
                active={activePath === itemPath(item)}
                onOpen={() => navigate(itemPath(item))}
                notes={notes}
                dragItem={dragItem}
                onReorderOnto={onReorderOnto}
              />
            ))}
          </Section>
        )}
      </div>

      {/* Trash */}
      <div className="shrink-0 border-t border-border-subtle px-2 py-2">
        <button
          type="button"
          onClick={() => navigate(NOTES_TRASH)}
          aria-current={activePath === NOTES_TRASH ? 'page' : undefined}
          className={cn(
            'focus-ring flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-small transition-fast',
            activePath === NOTES_TRASH ? 'bg-surface-selected text-foreground' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
          )}
        >
          <Trash2 className="size-4 shrink-0" />
          <span className="flex-1">Trash</span>
          {notes.trashedItems.length > 0 && <span className="text-caption tabular-nums text-subtle-foreground">{notes.trashedItems.length}</span>}
        </button>
      </div>

      <NoteSearchDialog open={searchOpen} onOpenChange={setSearchOpen} items={notes.items} onSelect={(item) => navigate(itemPath(item))} />

      <ConfirmDialog
        open={deleteFolderId !== null}
        onOpenChange={(o) => !o && setDeleteFolderId(null)}
        title="Delete this folder?"
        description="The folder is removed. Notes inside it are kept and become uncategorized; subfolders move up a level."
        confirmLabel="Delete folder"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteFolder}
      />
    </aside>
  )
}

// ---- section wrapper -----------------------------------------------------------------------------

function Section({ label, action, children, onDrop }: { label: string; action?: React.ReactNode; children: React.ReactNode; onDrop?: () => void }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={cn('mt-3 first:mt-1', over && 'rounded-md ring-1 ring-accent/40')}
      onDragOver={onDrop ? (e) => { e.preventDefault(); setOver(true) } : undefined}
      onDragLeave={onDrop ? () => setOver(false) : undefined}
      onDrop={onDrop ? () => { setOver(false); onDrop() } : undefined}
    >
      <div className="group/section flex items-center justify-between px-2 pb-0.5">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">{label}</span>
        {action && <span className="opacity-0 transition-fast group-hover/section:opacity-100">{action}</span>}
      </div>
      {children}
    </div>
  )
}

// ---- folder branch (recursive) -------------------------------------------------------------------

interface BranchCommon {
  notes: ReturnType<typeof useNotes>
  activePath: string
  navigate: (to: string) => void
  onNewNote: (folderId: string | null) => void
  onNewSubfolder: (parentId: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  renamingId: string | null
  renameValue: string
  setRenameValue: (v: string) => void
  commitRename: (id: string) => void
  cancelRename: () => void
  expanded: Set<string>
  onToggle: (id: string) => void
  dragItem: React.MutableRefObject<NoteListItem | null>
  onDropInFolder: (folderId: string | null) => void
  onReorderOnto: (target: NoteListItem) => void
}

function FolderBranch({ node, depth, ...c }: { node: FolderNode; depth: number } & BranchCommon) {
  const { folder } = node
  const isOpen = c.expanded.has(folder.id)
  const childNotes = notesInFolder(c.notes.items, folder.id)
  const [over, setOver] = useState(false)
  const pad = 8 + depth * 12

  if (c.renamingId === folder.id) {
    return <FolderNameInput value={c.renameValue} onChange={c.setRenameValue} onCommit={() => c.commitRename(folder.id)} onCancel={c.cancelRename} depth={depth} />
  }

  return (
    <div>
      <div
        className={cn('group flex items-center rounded-md pr-1 transition-fast hover:bg-surface-hover', over && 'bg-accent/10 ring-1 ring-accent/40')}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={() => { setOver(false); c.onDropInFolder(folder.id) }}
      >
        <button
          type="button"
          onClick={() => c.onToggle(folder.id)}
          style={{ paddingLeft: pad }}
          className="focus-ring flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md text-left text-small text-muted-foreground transition-fast hover:text-foreground"
        >
          {isOpen ? <ChevronDown className="size-3.5 shrink-0 text-subtle-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground" />}
          <span className="shrink-0 text-[0.95rem] leading-none">{folder.icon ?? '📁'}</span>
          <span className="min-w-0 flex-1 truncate font-medium">{folder.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button type="button" aria-label={`${folder.name} options`} className="focus-ring flex size-6 shrink-0 items-center justify-center rounded text-subtle-foreground opacity-0 transition-fast hover:text-foreground group-hover:opacity-100 [&>svg]:size-3.5">
              <MoreHorizontal />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent width={190} placement="bottom-end">
            <DropdownMenuItem icon={<FilePlus2 />} onSelect={() => c.onNewNote(folder.id)}>New note inside</DropdownMenuItem>
            <DropdownMenuItem icon={<FolderPlus />} onSelect={() => c.onNewSubfolder(folder.id)}>New subfolder</DropdownMenuItem>
            <DropdownMenuItem icon={<Pencil />} onSelect={() => c.onRename(folder.id, folder.name)}>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => c.onDelete(folder.id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isOpen && (
        <div>
          {node.children.map((child) => (
            <FolderBranch key={child.folder.id} node={child} depth={depth + 1} {...c} />
          ))}
          {childNotes.map((item) => (
            <NoteLeaf
              key={item.id}
              item={item}
              depth={depth + 1}
              active={c.activePath === itemPath(item)}
              onOpen={() => c.navigate(itemPath(item))}
              notes={c.notes}
              dragItem={c.dragItem}
              onReorderOnto={c.onReorderOnto}
            />
          ))}
          {node.children.length === 0 && childNotes.length === 0 && (
            <p style={{ paddingLeft: pad + 20 }} className="py-1 text-caption text-subtle-foreground">Empty</p>
          )}
        </div>
      )}
    </div>
  )
}

// ---- note leaf -----------------------------------------------------------------------------------

function NoteLeaf({
  item,
  depth,
  active,
  onOpen,
  notes,
  dragItem,
  onReorderOnto,
}: {
  item: NoteListItem
  depth: number
  active: boolean
  onOpen: () => void
  notes: ReturnType<typeof useNotes>
  dragItem: React.MutableRefObject<NoteListItem | null>
  onReorderOnto: (target: NoteListItem) => void
}) {
  const [over, setOver] = useState(false)
  const draggable = item.source === 'personal'
  const pad = 8 + depth * 12
  const icon = item.icon ?? (item.source === 'meeting' ? undefined : undefined)

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? () => { dragItem.current = item } : undefined}
      onDragOver={draggable ? (e) => { e.preventDefault(); setOver(true) } : undefined}
      onDragLeave={draggable ? () => setOver(false) : undefined}
      onDrop={draggable ? () => { setOver(false); onReorderOnto(item) } : undefined}
      className={cn(
        'group flex items-center rounded-md pr-1 transition-fast',
        active ? 'bg-surface-selected' : 'hover:bg-surface-hover',
        over && 'ring-1 ring-accent/50',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{ paddingLeft: pad }}
        aria-current={active ? 'page' : undefined}
        className={cn('focus-ring flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md text-left text-small transition-fast', active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}
      >
        <span className="flex size-4 shrink-0 items-center justify-center text-[0.95rem] leading-none text-subtle-foreground">
          {icon ?? (item.source === 'meeting' ? <Video className="size-3.5" /> : <NotebookText className="size-3.5" />)}
        </span>
        <span className="min-w-0 flex-1 truncate">{displayTitle(item.title)}</span>
        {item.favorite && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Favorite" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <button type="button" aria-label={`${item.title} options`} className="focus-ring flex size-6 shrink-0 items-center justify-center rounded text-subtle-foreground opacity-0 transition-fast hover:text-foreground group-hover:opacity-100 [&>svg]:size-3.5">
            <MoreHorizontal />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent width={200} placement="bottom-end">
          <DropdownMenuItem icon={<Star />} onSelect={() => notes.toggleFavorite(item)}>
            {item.favorite ? 'Remove favorite' : 'Add to favorites'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
          <DropdownMenuItem icon={item.folderId === null ? <Check /> : undefined} onSelect={() => notes.moveToFolder(item, null)}>
            Uncategorized
          </DropdownMenuItem>
          {notes.folders.map((f) => (
            <DropdownMenuItem key={f.id} icon={item.folderId === f.id ? <Check /> : undefined} onSelect={() => notes.moveToFolder(item, f.id)}>
              {f.name}
            </DropdownMenuItem>
          ))}
          {item.source === 'personal' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => notes.moveToTrash(item)}>Move to Trash</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function FolderNameInput({ value, onChange, onCommit, onCancel, depth }: { value: string; onChange: (v: string) => void; onCommit: () => void; onCancel: () => void; depth: number }) {
  return (
    <div style={{ paddingLeft: 8 + depth * 12 }} className="py-0.5 pr-1">
      <Input
        autoFocus
        placeholder="Folder name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit()
          if (e.key === 'Escape') onCancel()
        }}
        className="h-7 text-small"
      />
    </div>
  )
}
