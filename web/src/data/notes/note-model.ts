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
  created_at_ms: number
  updated_at_ms: number
}

/** Firestore shape of a folder (`note_folders/{id}`). One level only — no nesting in V1. */
export interface NoteFolderDoc {
  id: string
  workspace_id: string
  author_id: string
  name: string
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

/** Workspace + author scoping predicate — the client-side guard mirroring the Firestore rules. */
export function noteBelongsTo(
  note: { workspace_id: string; author_id: string },
  workspaceId: string,
  authorId: string,
): boolean {
  return note.workspace_id === workspaceId && note.author_id === authorId
}
