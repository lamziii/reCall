'use client'

/**
 * useNotes — the Notes Hub data hook. Merges standalone personal notes (notes-store) with meeting
 * notes adapted from the workspace's sessions (live only) into one NoteListItem[]. Exposes actions
 * that route to the correct backend based on the item's source, so the UI never branches on it.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { isLiveMode } from '@/data/live/data-mode'
import { subscribeSessions } from '@/data/live/live-store'
import type { LiveSessionDoc } from '@/data/live/types'
import {
  itemsInFolder,
  meetingNoteToItem,
  personalNoteToItem,
  type NoteFolderDoc,
  type NoteListItem,
  type PersonalNoteDoc,
} from './note-model'
import {
  createFolder as storeCreateFolder,
  createNote as storeCreateNote,
  deleteFolder as storeDeleteFolder,
  deleteNote as storeDeleteNote,
  renameFolder as storeRenameFolder,
  subscribeFolders,
  subscribeNotes,
  updateMeetingNoteMeta,
  updateNote,
} from './notes-store'

function tsToMs(ts: { toMillis?: () => number } | null | undefined, fallback: number): number {
  return ts?.toMillis ? ts.toMillis() : fallback
}

export interface UseNotesResult {
  items: NoteListItem[]
  folders: NoteFolderDoc[]
  loading: boolean
  createNote: (folderId?: string | null) => Promise<string>
  deleteNote: (item: NoteListItem) => Promise<void>
  toggleFavorite: (item: NoteListItem) => Promise<void>
  moveToFolder: (item: NoteListItem, folderId: string | null) => Promise<void>
  createFolder: (name: string) => Promise<string>
  renameFolder: (id: string, name: string) => Promise<void>
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
        // Personal-notes read unavailable (e.g. rules not yet deployed) — don't hang the hub; still
        // show meeting notes. Surfaced once for the developer.
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

  const items = useMemo<NoteListItem[]>(() => {
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

  const createNote = useCallback(
    (folderId?: string | null) => storeCreateNote({ workspaceId, authorId, folderId: folderId ?? null }),
    [workspaceId, authorId],
  )

  const deleteNote = useCallback(async (item: NoteListItem) => {
    // Only personal notes are deletable here — a meeting note's content belongs to its Session.
    if (item.source === 'personal' && item.noteId) await storeDeleteNote(item.noteId)
  }, [])

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
      if (item.source === 'personal' && item.noteId) await updateNote(item.noteId, { folderId })
      else if (item.source === 'meeting' && item.sessionId) await updateMeetingNoteMeta(item.sessionId, authorId, { folderId })
    },
    [authorId],
  )

  const createFolder = useCallback(
    (name: string) => storeCreateFolder(workspaceId, authorId, name.trim() || 'New folder', folders.length),
    [workspaceId, authorId, folders.length],
  )

  const deleteFolder = useCallback(
    async (id: string) => {
      // Safety: notes survive — clear folder_id on every note in this folder (both sources), THEN
      // delete the folder. Order matters so a note is never orphaned pointing at a dead folder.
      const affected = itemsInFolder(items, id)
      await Promise.all(affected.map((i) => moveToFolder(i, null)))
      await storeDeleteFolder(id)
    },
    [items, moveToFolder],
  )

  return {
    items,
    folders: [...folders].sort((a, b) => a.sort_order - b.sort_order),
    loading: !notesReady,
    createNote,
    deleteNote,
    toggleFavorite,
    moveToFolder,
    createFolder,
    renameFolder: storeRenameFolder,
    deleteFolder,
  }
}
