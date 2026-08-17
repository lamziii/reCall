'use client'

/**
 * useNotes — the Notes workspace data hook. Merges standalone personal notes (notes-store) with
 * meeting notes adapted from the workspace's sessions (live only) into one NoteListItem[]. Exposes
 * actions that route to the correct backend based on the item's source, so the UI never branches on it.
 *
 * `items` excludes trashed notes (the working set); `trashedItems` is the Trash. Meeting notes never
 * enter the Trash — their content is the Session's, so delete/trash is a no-op for them (the UI hides
 * the affordance). Manual ordering lives in `sort_order`; the UI computes new orderings with the pure
 * reorderIds() helper and calls persistOrder to write them.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { isLiveMode } from '@/data/live/data-mode'
import { subscribeSessions } from '@/data/live/live-store'
import type { LiveSessionDoc } from '@/data/live/types'
import {
  activeItems,
  folderDescendantIds,
  meetingNoteToItem,
  nextSortOrder,
  notesInFolder,
  personalNoteToItem,
  trashedItems,
  type NoteFolderDoc,
  type NoteListItem,
  type PersonalNoteDoc,
} from './note-model'
import {
  createFolder as storeCreateFolder,
  createNote as storeCreateNote,
  deleteFolder as storeDeleteFolder,
  deleteNote as storeDeleteNote,
  subscribeFolders,
  subscribeNotes,
  updateFolder as storeUpdateFolder,
  updateMeetingNoteMeta,
  updateNote,
} from './notes-store'
import type { FolderPatch } from './notes-store'

function tsToMs(ts: { toMillis?: () => number } | null | undefined, fallback: number): number {
  return ts?.toMillis ? ts.toMillis() : fallback
}

export interface UseNotesResult {
  /** Active (non-trashed) notes — personal + meeting. */
  items: NoteListItem[]
  /** Notes currently in the Trash (personal only). */
  trashedItems: NoteListItem[]
  folders: NoteFolderDoc[]
  loading: boolean
  createNote: (folderId?: string | null) => Promise<string>
  toggleFavorite: (item: NoteListItem) => Promise<void>
  moveToFolder: (item: NoteListItem, folderId: string | null) => Promise<void>
  setIcon: (item: NoteListItem, icon: string | null) => Promise<void>
  /** Persist a new ordering (id → sort_order = index). Only personal notes carry manual order. */
  persistOrder: (orderedIds: string[]) => Promise<void>
  /** Soft-delete: move a personal note to Trash. No-op for meeting notes. */
  moveToTrash: (item: NoteListItem) => Promise<void>
  restore: (item: NoteListItem) => Promise<void>
  /** Permanent delete from Trash — never touches a Session. */
  permanentDelete: (item: NoteListItem) => Promise<void>
  createFolder: (name: string, parentId?: string | null) => Promise<string>
  updateFolder: (id: string, patch: FolderPatch) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
}

export function useNotes(): UseNotesResult {
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const authorId = user?.id ?? 'unknown'

  const [notes, setNotes] = useState<PersonalNoteDoc[]>([])
  const [folders, setFolders] = useState<NoteFolderDoc[]>([])
  const [sessions, setSessions] = useState<LiveSessionDoc[]>([])
  const [notesReady, setNotesReady] = useState(false)

  useEffect(() => {
    setNotesReady(false)
    const unsub = subscribeNotes(
      workspaceId,
      authorId,
      (n) => {
        setNotes(n)
        setNotesReady(true)
      },
      () => {
        console.error('[Notes] personal notes unavailable — is the notes Firestore rule deployed?')
        setNotes([])
        setNotesReady(true)
      },
    )
    return unsub
  }, [workspaceId, authorId])

  useEffect(() => subscribeFolders(workspaceId, authorId, setFolders), [workspaceId, authorId])

  useEffect(() => {
    if (!isLiveMode) return
    return subscribeSessions(workspaceId, setSessions, () => setSessions([]))
  }, [workspaceId])

  const allItems = useMemo<NoteListItem[]>(() => {
    const personal = notes.map(personalNoteToItem)
    const meeting: NoteListItem[] = []
    for (const s of sessions) {
      const slot = s.user_notes?.[authorId]
      if (!slot) continue
      const item = meetingNoteToItem({
        sessionId: s.id,
        sessionTitle: s.title,
        sessionCreatedAtMs: tsToMs(s.created_at, slot.updated_at_ms ?? Date.now()),
        durationSeconds: s.duration_seconds ?? s.audio?.durationSeconds ?? null,
        note: {
          content: slot.content,
          doc: slot.doc,
          updated_at_ms: slot.updated_at_ms,
          folder_id: (slot as { folder_id?: string | null }).folder_id ?? null,
          favorite: (slot as { favorite?: boolean }).favorite ?? false,
        },
      })
      if (item) meeting.push(item)
    }
    return [...personal, ...meeting]
  }, [notes, sessions, authorId])

  const items = useMemo(() => activeItems(allItems), [allItems])
  const trashed = useMemo(() => trashedItems(allItems), [allItems])

  const createNote = useCallback(
    (folderId?: string | null) => {
      const target = folderId ?? null
      const sortOrder = nextSortOrder(notesInFolder(items, target))
      return storeCreateNote({ workspaceId, authorId, folderId: target, sortOrder })
    },
    [workspaceId, authorId, items],
  )

  const toggleFavorite = useCallback(
    async (item: NoteListItem) => {
      const next = !item.favorite
      if (item.source === 'personal' && item.noteId) await updateNote(item.noteId, { favorite: next })
      else if (item.source === 'meeting' && item.sessionId) await updateMeetingNoteMeta(item.sessionId, authorId, { favorite: next })
    },
    [authorId],
  )

  const moveToFolder = useCallback(
    async (item: NoteListItem, folderId: string | null) => {
      if (item.source === 'personal' && item.noteId) {
        const sortOrder = nextSortOrder(notesInFolder(items, folderId))
        await updateNote(item.noteId, { folderId, sortOrder })
      } else if (item.source === 'meeting' && item.sessionId) {
        await updateMeetingNoteMeta(item.sessionId, authorId, { folderId })
      }
    },
    [authorId, items],
  )

  const setIcon = useCallback(async (item: NoteListItem, icon: string | null) => {
    if (item.source === 'personal' && item.noteId) await updateNote(item.noteId, { icon })
  }, [])

  const persistOrder = useCallback(async (orderedIds: string[]) => {
    // Assign a stepped sort_order so future inserts have room; only personal notes carry order.
    await Promise.all(orderedIds.map((id, i) => updateNote(id, { sortOrder: i })))
  }, [])

  const moveToTrash = useCallback(async (item: NoteListItem) => {
    if (item.source === 'personal' && item.noteId) await updateNote(item.noteId, { trashed: true })
  }, [])

  const restore = useCallback(async (item: NoteListItem) => {
    if (item.source === 'personal' && item.noteId) await updateNote(item.noteId, { trashed: false })
  }, [])

  const permanentDelete = useCallback(async (item: NoteListItem) => {
    if (item.source === 'personal' && item.noteId) await storeDeleteNote(item.noteId)
  }, [])

  const createFolder = useCallback(
    (name: string, parentId: string | null = null) => storeCreateFolder(workspaceId, authorId, name.trim() || 'New folder', folders.length, parentId),
    [workspaceId, authorId, folders.length],
  )

  const deleteFolder = useCallback(
    async (id: string) => {
      // Safety: nothing is destroyed. Direct child folders reparent to this folder's parent, and every
      // note inside (both sources) has its folder_id cleared → Uncategorized. THEN the folder is removed.
      const parentId = folders.find((f) => f.id === id)?.parent_id ?? null
      const childFolders = folders.filter((f) => f.parent_id === id)
      const affected = allItems.filter((i) => i.folderId === id)
      await Promise.all([
        ...childFolders.map((c) => storeUpdateFolder(c.id, { parentId })),
        ...affected.map((i) => moveToFolder(i, null)),
      ])
      await storeDeleteFolder(id)
    },
    [folders, allItems, moveToFolder],
  )

  return {
    items,
    trashedItems: trashed,
    folders: [...folders].sort((a, b) => a.sort_order - b.sort_order),
    loading: !notesReady,
    createNote,
    toggleFavorite,
    moveToFolder,
    setIcon,
    persistOrder,
    moveToTrash,
    restore,
    permanentDelete,
    createFolder,
    updateFolder: storeUpdateFolder,
    deleteFolder,
  }
}

// Re-export for callers that constrain moves; keeps the cycle guard testable + shared.
export { folderDescendantIds }
