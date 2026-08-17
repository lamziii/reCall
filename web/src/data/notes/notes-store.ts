'use client'

/**
 * Notes persistence for the Notes Hub. One interface, two backends chosen by data-mode:
 *  - LIVE  → Firestore `notes` + `note_folders` collections (author-scoped; see firestore.rules).
 *  - DEMO  → localStorage (so the feature is fully usable without auth/Firebase for other devs).
 *
 * Personal-note reads are AUTHOR-scoped (`where('author_id','==',uid)`) — a single-field query that is
 * rule-satisfiable with NO composite index, then filtered to the active workspace client-side. Volume
 * per author is bounded, so client-side sort/search is fine (documented limitation).
 *
 * Meeting notes are NOT stored here — they live on `sessions.user_notes.{authorId}` (unchanged). This
 * module only writes their folder/favorite METADATA back onto that slot (updateMeetingNoteMeta).
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { isLiveMode } from '@/data/live/data-mode'
import { structuredNotesToPlainText, type NotesDoc } from '@/data/active-session/notes-doc'
import { DEFAULT_PAPER_STYLE, emptyPersonalNoteDoc, type NoteFolderDoc, type PaperStyle, type PersonalNoteDoc } from './note-model'

export interface CreateNoteInput {
  workspaceId: string
  authorId: string
  title?: string
  folderId?: string | null
  sortOrder?: number
  doc?: NotesDoc
  paperStyle?: PaperStyle
}
export interface NotePatch {
  title?: string
  folderId?: string | null
  favorite?: boolean
  icon?: string | null
  sortOrder?: number
  /** Soft-delete toggle: true → move to Trash (stamps trashed_at_ms), false → restore. */
  trashed?: boolean
  doc?: NotesDoc
  paperStyle?: PaperStyle
}
export interface FolderPatch {
  name?: string
  parentId?: string | null
  icon?: string | null
  sortOrder?: number
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ================================================================= LIVE (Firestore)

function liveSubscribeNotes(workspaceId: string, authorId: string, cb: (n: PersonalNoteDoc[]) => void, onError: (e: unknown) => void) {
  const q = query(collection(getDb(), 'notes'), where('author_id', '==', authorId))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<PersonalNoteDoc, 'id'>) }))
        .filter((n) => n.workspace_id === workspaceId)
      cb(rows)
    },
    onError,
  )
}

function liveSubscribeFolders(workspaceId: string, authorId: string, cb: (f: NoteFolderDoc[]) => void, onError: (e: unknown) => void) {
  const q = query(collection(getDb(), 'note_folders'), where('author_id', '==', authorId))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<NoteFolderDoc, 'id'>) }))
        .filter((f) => f.workspace_id === workspaceId)
      cb(rows)
    },
    onError,
  )
}

async function liveCreateNote(input: CreateNoteInput): Promise<string> {
  const ref = doc(collection(getDb(), 'notes'))
  const body = input.doc ?? emptyPersonalNoteDoc()
  const now = Date.now()
  const payload: Omit<PersonalNoteDoc, 'id'> & { updated_at: unknown; created_at: unknown } = {
    workspace_id: input.workspaceId,
    author_id: input.authorId,
    title: input.title ?? '',
    source: 'personal',
    session_id: null,
    folder_id: input.folderId ?? null,
    favorite: false,
    icon: null,
    paper_style: input.paperStyle ?? DEFAULT_PAPER_STYLE,
    sort_order: input.sortOrder ?? now,
    trashed_at_ms: null,
    visibility: 'private',
    content: structuredNotesToPlainText(body),
    doc: body,
    format: 'tiptap',
    created_at_ms: now,
    updated_at_ms: now,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return ref.id
}

async function liveUpdateNote(id: string, patch: NotePatch): Promise<void> {
  const fields: Record<string, unknown> = { updated_at_ms: Date.now(), updated_at: serverTimestamp() }
  if (patch.title !== undefined) fields.title = patch.title
  if (patch.folderId !== undefined) fields.folder_id = patch.folderId
  if (patch.favorite !== undefined) fields.favorite = patch.favorite
  if (patch.icon !== undefined) fields.icon = patch.icon
  if (patch.paperStyle !== undefined) fields.paper_style = patch.paperStyle
  if (patch.sortOrder !== undefined) fields.sort_order = patch.sortOrder
  if (patch.trashed !== undefined) fields.trashed_at_ms = patch.trashed ? Date.now() : null
  if (patch.doc !== undefined) {
    fields.doc = patch.doc
    fields.content = structuredNotesToPlainText(patch.doc)
  }
  await updateDoc(doc(getDb(), 'notes', id), fields)
}

async function liveGetNote(id: string): Promise<PersonalNoteDoc | null> {
  const snap = await getDoc(doc(getDb(), 'notes', id))
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<PersonalNoteDoc, 'id'>) }) : null
}

async function liveDeleteNote(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'notes', id))
}

async function liveCreateFolder(workspaceId: string, authorId: string, name: string, sortOrder: number, parentId: string | null): Promise<string> {
  const ref = doc(collection(getDb(), 'note_folders'))
  const now = Date.now()
  await setDoc(ref, {
    workspace_id: workspaceId,
    author_id: authorId,
    name,
    parent_id: parentId,
    icon: null,
    sort_order: sortOrder,
    created_at_ms: now,
    updated_at_ms: now,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  return ref.id
}

async function liveUpdateFolder(id: string, patch: FolderPatch): Promise<void> {
  const fields: Record<string, unknown> = { updated_at_ms: Date.now(), updated_at: serverTimestamp() }
  if (patch.name !== undefined) fields.name = patch.name
  if (patch.parentId !== undefined) fields.parent_id = patch.parentId
  if (patch.icon !== undefined) fields.icon = patch.icon
  if (patch.sortOrder !== undefined) fields.sort_order = patch.sortOrder
  await updateDoc(doc(getDb(), 'note_folders', id), fields)
}

/** Deletes the folder only. Notes keep existing; the caller clears their folder_id (→ Uncategorized). */
async function liveDeleteFolder(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'note_folders', id))
}

/** Writes folder/favorite metadata back onto a session's author note slot (meeting notes). */
async function liveUpdateMeetingNoteMeta(sessionId: string, authorId: string, patch: { folderId?: string | null; favorite?: boolean; paperStyle?: PaperStyle }): Promise<void> {
  const fields: Record<string, unknown> = { updated_at: serverTimestamp() }
  if (patch.folderId !== undefined) fields[`user_notes.${authorId}.folder_id`] = patch.folderId
  if (patch.favorite !== undefined) fields[`user_notes.${authorId}.favorite`] = patch.favorite
  if (patch.paperStyle !== undefined) fields[`user_notes.${authorId}.paper_style`] = patch.paperStyle
  await updateDoc(doc(getDb(), 'sessions', sessionId), fields)
}

// ================================================================= DEMO (localStorage)

const LS_NOTES = 'recall:notes'
const LS_FOLDERS = 'recall:note-folders'
type Listener = () => void
const listeners = new Set<Listener>()

function lsRead<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}
function lsWrite<T>(key: string, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows))
  listeners.forEach((l) => l())
}
function emitOnly() {
  listeners.forEach((l) => l())
}

function localSubscribeNotes(workspaceId: string, authorId: string, cb: (n: PersonalNoteDoc[]) => void) {
  const emit = () => cb(lsRead<PersonalNoteDoc>(LS_NOTES).filter((n) => n.workspace_id === workspaceId && n.author_id === authorId))
  listeners.add(emit)
  emit()
  return () => listeners.delete(emit)
}
function localSubscribeFolders(workspaceId: string, authorId: string, cb: (f: NoteFolderDoc[]) => void) {
  const emit = () => cb(lsRead<NoteFolderDoc>(LS_FOLDERS).filter((f) => f.workspace_id === workspaceId && f.author_id === authorId))
  listeners.add(emit)
  emit()
  return () => listeners.delete(emit)
}
function localCreateNote(input: CreateNoteInput): string {
  const body = input.doc ?? emptyPersonalNoteDoc()
  const now = Date.now()
  const note: PersonalNoteDoc = {
    id: newId('note'),
    workspace_id: input.workspaceId,
    author_id: input.authorId,
    title: input.title ?? '',
    source: 'personal',
    session_id: null,
    folder_id: input.folderId ?? null,
    favorite: false,
    icon: null,
    paper_style: input.paperStyle ?? DEFAULT_PAPER_STYLE,
    sort_order: input.sortOrder ?? now,
    trashed_at_ms: null,
    visibility: 'private',
    content: structuredNotesToPlainText(body),
    doc: body,
    format: 'tiptap',
    created_at_ms: now,
    updated_at_ms: now,
  }
  lsWrite(LS_NOTES, [...lsRead<PersonalNoteDoc>(LS_NOTES), note])
  return note.id
}
function localUpdateNote(id: string, patch: NotePatch): void {
  const rows = lsRead<PersonalNoteDoc>(LS_NOTES).map((n) => {
    if (n.id !== id) return n
    const next = { ...n, updated_at_ms: Date.now() }
    if (patch.title !== undefined) next.title = patch.title
    if (patch.folderId !== undefined) next.folder_id = patch.folderId
    if (patch.favorite !== undefined) next.favorite = patch.favorite
    if (patch.icon !== undefined) next.icon = patch.icon
    if (patch.paperStyle !== undefined) next.paper_style = patch.paperStyle
    if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder
    if (patch.trashed !== undefined) next.trashed_at_ms = patch.trashed ? Date.now() : null
    if (patch.doc !== undefined) {
      next.doc = patch.doc
      next.content = structuredNotesToPlainText(patch.doc)
    }
    return next
  })
  lsWrite(LS_NOTES, rows)
}
function localGetNote(id: string): PersonalNoteDoc | null {
  return lsRead<PersonalNoteDoc>(LS_NOTES).find((n) => n.id === id) ?? null
}
function localDeleteNote(id: string): void {
  lsWrite(LS_NOTES, lsRead<PersonalNoteDoc>(LS_NOTES).filter((n) => n.id !== id))
}
function localCreateFolder(workspaceId: string, authorId: string, name: string, sortOrder: number, parentId: string | null): string {
  const now = Date.now()
  const folder: NoteFolderDoc = { id: newId('folder'), workspace_id: workspaceId, author_id: authorId, name, parent_id: parentId, icon: null, sort_order: sortOrder, created_at_ms: now, updated_at_ms: now }
  lsWrite(LS_FOLDERS, [...lsRead<NoteFolderDoc>(LS_FOLDERS), folder])
  return folder.id
}
function localUpdateFolder(id: string, patch: FolderPatch): void {
  lsWrite(LS_FOLDERS, lsRead<NoteFolderDoc>(LS_FOLDERS).map((f) => {
    if (f.id !== id) return f
    const next = { ...f, updated_at_ms: Date.now() }
    if (patch.name !== undefined) next.name = patch.name
    if (patch.parentId !== undefined) next.parent_id = patch.parentId
    if (patch.icon !== undefined) next.icon = patch.icon
    if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder
    return next
  }))
}
function localDeleteFolder(id: string): void {
  lsWrite(LS_FOLDERS, lsRead<NoteFolderDoc>(LS_FOLDERS).filter((f) => f.id !== id))
  // Clear folder_id on affected notes (→ Uncategorized).
  lsWrite(LS_NOTES, lsRead<PersonalNoteDoc>(LS_NOTES).map((n) => (n.folder_id === id ? { ...n, folder_id: null } : n)))
  emitOnly()
}

// ================================================================= Public API (mode switch)

export function subscribeNotes(workspaceId: string, authorId: string, cb: (n: PersonalNoteDoc[]) => void, onError: (e: unknown) => void = () => {}) {
  return isLiveMode ? liveSubscribeNotes(workspaceId, authorId, cb, onError) : localSubscribeNotes(workspaceId, authorId, cb)
}
export function subscribeFolders(workspaceId: string, authorId: string, cb: (f: NoteFolderDoc[]) => void, onError: (e: unknown) => void = () => {}) {
  return isLiveMode ? liveSubscribeFolders(workspaceId, authorId, cb, onError) : localSubscribeFolders(workspaceId, authorId, cb)
}
export function createNote(input: CreateNoteInput): Promise<string> {
  return isLiveMode ? liveCreateNote(input) : Promise.resolve(localCreateNote(input))
}
export function updateNote(id: string, patch: NotePatch): Promise<void> {
  return isLiveMode ? liveUpdateNote(id, patch) : Promise.resolve(localUpdateNote(id, patch))
}
export function getNote(id: string): Promise<PersonalNoteDoc | null> {
  return isLiveMode ? liveGetNote(id) : Promise.resolve(localGetNote(id))
}
export function deleteNote(id: string): Promise<void> {
  return isLiveMode ? liveDeleteNote(id) : Promise.resolve(localDeleteNote(id))
}
export function createFolder(workspaceId: string, authorId: string, name: string, sortOrder: number, parentId: string | null = null): Promise<string> {
  return isLiveMode ? liveCreateFolder(workspaceId, authorId, name, sortOrder, parentId) : Promise.resolve(localCreateFolder(workspaceId, authorId, name, sortOrder, parentId))
}
export function updateFolder(id: string, patch: FolderPatch): Promise<void> {
  return isLiveMode ? liveUpdateFolder(id, patch) : Promise.resolve(localUpdateFolder(id, patch))
}
export function deleteFolder(id: string): Promise<void> {
  return isLiveMode ? liveDeleteFolder(id) : Promise.resolve(localDeleteFolder(id))
}
export function updateMeetingNoteMeta(sessionId: string, authorId: string, patch: { folderId?: string | null; favorite?: boolean; paperStyle?: PaperStyle }): Promise<void> {
  return isLiveMode ? liveUpdateMeetingNoteMeta(sessionId, authorId, patch) : Promise.resolve()
}
