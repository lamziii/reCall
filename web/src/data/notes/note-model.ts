/**
 * Canonical Note model + pure view-model logic for the Notes Hub. No Firebase/React imports so it is
 * trivially testable and reusable server-side later.
 *
 * TWO SOURCES, ONE VIEW (Option B — the least-risky architecture):
 *  - "personal" notes live in their own `notes` collection (authored anywhere, no session).
 *  - "meeting" notes stay in `sessions.user_notes.{authorId}` (unchanged — historical notes intact);
 *    an adapter maps sessions-with-notes into the SAME NoteListItem shape. Clicking a meeting note
 *    deep-links to the Session Notes tab, so meeting-note content is never duplicated.
 *
 * Folder/favorite metadata applies to both: personal notes store it natively; meeting notes store it
 * on their session note slot (folder_id / favorite).
 */
import { docIsEmpty, isNotesDoc, plainTextToDoc, type NotesDoc } from '../active-session/notes-doc'

export type NoteSource = 'personal' | 'meeting'
export type NoteVisibility = 'private' | 'workspace'

/** Selectable page/notebook background for a note's writing canvas. */
export const PAPER_STYLES = ['blank', 'lined', 'dotted', 'grid'] as const
export type PaperStyle = (typeof PAPER_STYLES)[number]
export const DEFAULT_PAPER_STYLE: PaperStyle = 'blank'
export function asPaperStyle(v: unknown): PaperStyle {
  return (PAPER_STYLES as readonly string[]).includes(v as string) ? (v as PaperStyle) : DEFAULT_PAPER_STYLE
}

/** Firestore shape of a standalone personal note (`notes/{id}`). snake_case matches the repo convention. */
export interface PersonalNoteDoc {
  id: string
  workspace_id: string
  author_id: string
  title: string
  source: 'personal'
  session_id: string | null
  folder_id: string | null
  favorite: boolean
  /** Future Teams seam — do not expose UI yet. Defaults 'private'. */
  visibility: NoteVisibility
  /** Plain-text derivative for search/AI (never editor state). */
  content: string
  /** Structured editor JSON (ProseMirror/Tiptap). */
  doc: NotesDoc
  format: 'tiptap'
  /** Manual position within its folder (or the root). Lower = higher in the list. Optional for
   *  back-compat with pre-tree docs (treated as Infinity → falls to the end, then by updated). */
  sort_order?: number
  /** Optional page emoji/icon (e.g. "📘"). Null/undefined = no icon. */
  icon?: string | null
  /** Page/notebook background style. Optional for back-compat (missing → 'blank'). */
  paper_style?: PaperStyle
  /** Soft-delete: epoch ms when moved to Trash, else null/undefined. Notes are never hard-deleted
   *  until purged from Trash, so an accidental delete is recoverable. */
  trashed_at_ms?: number | null
  created_at_ms: number
  updated_at_ms: number
}

/** Firestore shape of a folder (`note_folders/{id}`). `parent_id` allows nesting (null = a root
 *  folder). The UI ships one level, but nothing here hard-codes depth — deeper nesting is a UI change
 *  only. */
export interface NoteFolderDoc {
  id: string
  workspace_id: string
  author_id: string
  name: string
  /** Parent folder id for nesting, or null for a root folder. Optional for back-compat (→ root). */
  parent_id?: string | null
  icon?: string | null
  sort_order: number
  created_at_ms: number
  updated_at_ms: number
}

/** The unified row the Notes Hub renders — normalized from either source. */
export interface NoteListItem {
  /** personal: the note doc id. meeting: `session:{sessionId}` (namespaced so ids never collide). */
  id: string
  source: NoteSource
  title: string
  /** Full plain text — used for search. The UI truncates it for the row preview. */
  plainText: string
  folderId: string | null
  favorite: boolean
  /** Optional page emoji/icon. Personal notes only (meeting notes carry none). */
  icon?: string | null
  /** Manual position within its folder/root. Personal notes carry their stored order; meeting notes
   *  default to Infinity so they trail manually-ordered personal notes, then fall back to updatedAt. */
  sortOrder: number
  /** True when in Trash (personal notes only — a meeting note's content belongs to its Session). */
  trashed: boolean
  createdAtMs: number
  updatedAtMs: number
  /** meeting-only */
  sessionId?: string
  sessionDurationSeconds?: number | null
  /** personal-only */
  noteId?: string
}

export type NoteFilter = 'all' | 'personal' | 'meetings' | 'favorites' | { folderId: string }
export type NoteSort = 'updated' | 'newest' | 'oldest' | 'title'

export const DEFAULT_NOTE_TITLE = 'Untitled'

/** A note's display title, falling back to the placeholder for an empty title. */
export function displayTitle(title: string | null | undefined): string {
  const t = (title ?? '').trim()
  return t.length ? t : DEFAULT_NOTE_TITLE
}

// ---- Adapters (source doc → NoteListItem) --------------------------------------------------------

export function personalNoteToItem(n: PersonalNoteDoc): NoteListItem {
  return {
    id: n.id,
    source: 'personal',
    title: displayTitle(n.title),
    plainText: n.content ?? '',
    folderId: n.folder_id ?? null,
    favorite: Boolean(n.favorite),
    icon: n.icon ?? null,
    sortOrder: typeof n.sort_order === 'number' ? n.sort_order : Number.POSITIVE_INFINITY,
    trashed: typeof n.trashed_at_ms === 'number' && n.trashed_at_ms > 0,
    createdAtMs: n.created_at_ms,
    updatedAtMs: n.updated_at_ms,
    noteId: n.id,
  }
}

/** Minimal projection of a session needed to build a meeting-note row (keeps this file Firebase-free). */
export interface MeetingNoteInput {
  sessionId: string
  sessionTitle: string
  sessionCreatedAtMs: number
  durationSeconds?: number | null
  note: {
    content?: string
    doc?: unknown
    updated_at_ms?: number
    folder_id?: string | null
    favorite?: boolean
  }
}

/** Maps a session's author note slot into a NoteListItem. Returns null when the note has no content
 *  (an empty slot shouldn't clutter the hub). */
export function meetingNoteToItem(input: MeetingNoteInput): NoteListItem | null {
  const { note } = input
  const plainText = (note.content ?? '').trim()
  const structuredEmpty = isNotesDoc(note.doc) ? docIsEmpty(note.doc as NotesDoc) : !plainText
  if (!plainText && structuredEmpty) return null
  return {
    id: `session:${input.sessionId}`,
    source: 'meeting',
    title: displayTitle(input.sessionTitle),
    plainText: note.content ?? '',
    folderId: note.folder_id ?? null,
    favorite: Boolean(note.favorite),
    icon: null,
    sortOrder: Number.POSITIVE_INFINITY,
    trashed: false,
    createdAtMs: input.sessionCreatedAtMs,
    updatedAtMs: note.updated_at_ms ?? input.sessionCreatedAtMs,
    sessionId: input.sessionId,
    sessionDurationSeconds: input.durationSeconds ?? null,
  }
}

// ---- Filter / search / sort (pure) ---------------------------------------------------------------

export function filterNotes(items: NoteListItem[], filter: NoteFilter): NoteListItem[] {
  if (filter === 'all') return items
  if (filter === 'personal') return items.filter((i) => i.source === 'personal')
  if (filter === 'meetings') return items.filter((i) => i.source === 'meeting')
  if (filter === 'favorites') return items.filter((i) => i.favorite)
  return items.filter((i) => i.folderId === filter.folderId)
}

/** Case-insensitive match on title OR plain-text content. Empty query returns everything. */
export function searchNotes(items: NoteListItem[], query: string): NoteListItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((i) => i.title.toLowerCase().includes(q) || i.plainText.toLowerCase().includes(q))
}

export function sortNotes(items: NoteListItem[], sort: NoteSort): NoteListItem[] {
  const out = [...items]
  switch (sort) {
    case 'newest':
      return out.sort((a, b) => b.createdAtMs - a.createdAtMs)
    case 'oldest':
      return out.sort((a, b) => a.createdAtMs - b.createdAtMs)
    case 'title':
      return out.sort((a, b) => a.title.localeCompare(b.title))
    case 'updated':
    default:
      return out.sort((a, b) => b.updatedAtMs - a.updatedAtMs)
  }
}

/** Count per top-level filter, for the secondary-nav badges. */
export function countByFilter(items: NoteListItem[]) {
  return {
    all: items.length,
    personal: items.filter((i) => i.source === 'personal').length,
    meetings: items.filter((i) => i.source === 'meeting').length,
    favorites: items.filter((i) => i.favorite).length,
  }
}

/** Short preview string for a list row (first line, trimmed). */
export function notePreview(plainText: string, max = 120): string {
  const firstLine = plainText.split('\n').find((l) => l.trim().length) ?? ''
  const clean = firstLine.trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

/** A blank personal-note doc body (matches the editor's empty document). */
export function emptyPersonalNoteDoc(): NotesDoc {
  return plainTextToDoc('')
}

/** The notes that would be orphaned by deleting a folder — deletion clears their folder_id (never the
 *  notes). Used by the delete-folder flow so a note is never left pointing at a dead folder. */
export function itemsInFolder(items: NoteListItem[], folderId: string): NoteListItem[] {
  return items.filter((i) => i.folderId === folderId)
}

// ---- Trash / order / tree (pure) -----------------------------------------------------------------

/** Notes NOT in the Trash (the default working set). */
export function activeItems(items: NoteListItem[]): NoteListItem[] {
  return items.filter((i) => !i.trashed)
}

/** Notes currently in the Trash. */
export function trashedItems(items: NoteListItem[]): NoteListItem[] {
  return items.filter((i) => i.trashed)
}

/** Stable ordering within a folder/root: manual sortOrder ascending, then most-recently-updated. */
export function sortByOrder(items: NoteListItem[]): NoteListItem[] {
  return [...items].sort((a, b) => (a.sortOrder - b.sortOrder) || (b.updatedAtMs - a.updatedAtMs))
}

/** Next manual sort_order to assign so a new note lands at the end of a list. */
export function nextSortOrder(items: NoteListItem[]): number {
  const finite = items.map((i) => i.sortOrder).filter((n) => Number.isFinite(n)) as number[]
  return finite.length ? Math.max(...finite) + 1 : 0
}

/** Active personal notes directly inside a folder (null = root/uncategorized), in display order. */
export function notesInFolder(items: NoteListItem[], folderId: string | null): NoteListItem[] {
  return sortByOrder(activeItems(items).filter((i) => i.source === 'personal' && i.folderId === folderId))
}

export interface FolderNode {
  folder: NoteFolderDoc
  children: FolderNode[]
}

/** Builds the folder hierarchy from a flat list via parent_id. Roots = parent_id null/undefined or a
 *  parent that no longer exists (orphans surface at the root rather than vanishing). Cycles are broken
 *  defensively so a corrupt parent chain can never infinite-loop the UI. */
export function buildFolderTree(folders: NoteFolderDoc[]): FolderNode[] {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const nodes = new Map<string, FolderNode>(folders.map((f) => [f.id, { folder: f, children: [] }]))
  const roots: FolderNode[] = []
  const isReachableRoot = (id: string): boolean => {
    // Walk up; if we ever revisit, it's a cycle → treat as root to stay finite.
    const seen = new Set<string>()
    let cur: string | null | undefined = id
    while (cur) {
      if (seen.has(cur)) return false
      seen.add(cur)
      cur = byId.get(cur)?.parent_id ?? null
    }
    return true
  }
  const sortSibs = (a: FolderNode, b: FolderNode) => (a.folder.sort_order - b.folder.sort_order) || a.folder.name.localeCompare(b.folder.name)
  for (const f of folders) {
    const node = nodes.get(f.id)!
    const parent = f.parent_id ? nodes.get(f.parent_id) : undefined
    if (parent && isReachableRoot(f.id)) parent.children.push(node)
    else roots.push(node)
  }
  const sortRec = (list: FolderNode[]) => {
    list.sort(sortSibs)
    list.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

/** All descendant folder ids of `folderId` (not including it). Used to block moving a folder into its
 *  own subtree and to gather a subtree for deletion. */
export function folderDescendantIds(folders: NoteFolderDoc[], folderId: string): string[] {
  const childrenOf = new Map<string, string[]>()
  for (const f of folders) {
    if (!f.parent_id) continue
    const list = childrenOf.get(f.parent_id) ?? []
    list.push(f.id)
    childrenOf.set(f.parent_id, list)
  }
  const out: string[] = []
  const seen = new Set<string>()
  const walk = (id: string) => {
    for (const child of childrenOf.get(id) ?? []) {
      if (seen.has(child)) continue
      seen.add(child)
      out.push(child)
      walk(child)
    }
  }
  walk(folderId)
  return out
}

/** True if re-parenting `folderId` under `newParentId` would form a cycle (into itself or a descendant). */
export function wouldCreateFolderCycle(folders: NoteFolderDoc[], folderId: string, newParentId: string | null): boolean {
  if (!newParentId) return false
  if (newParentId === folderId) return true
  return folderDescendantIds(folders, folderId).includes(newParentId)
}

/** Pure reorder: move `fromId` to `toIndex` within an ordered id list. Returns the new ordering; the
 *  caller persists each id's new index as its sort_order. Out-of-range indices clamp. */
export function reorderIds(orderedIds: string[], fromId: string, toIndex: number): string[] {
  const from = orderedIds.indexOf(fromId)
  if (from === -1) return orderedIds
  const next = [...orderedIds]
  next.splice(from, 1)
  const clamped = Math.max(0, Math.min(toIndex, next.length))
  next.splice(clamped, 0, fromId)
  return next
}

/** Workspace + author scoping predicate — the client-side guard mirroring the Firestore rules. */
export function noteBelongsTo(
  note: { workspace_id: string; author_id: string },
  workspaceId: string,
  authorId: string,
): boolean {
  return note.workspace_id === workspaceId && note.author_id === authorId
}
