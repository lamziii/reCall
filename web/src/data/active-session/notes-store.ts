'use client'

/**
 * Durable session-notes persistence in Firestore. Notes live in a `user_notes` MAP on the session
 * doc, keyed by author id: `sessions/{sessionId}.user_notes.{authorId} = { content, marks, ... }`.
 *
 * Why a map field and not a subcollection: it reuses the existing `sessions` update rule
 * (workspace member) with NO rules/schema change, stays scoped to workspace+session+author, and is
 * trivially extensible to more authors. When real collaboration lands, migrate this to a subcollection.
 *
 * This is the durable tier of the autosave stack — written debounced, never on every keystroke.
 */
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import type { NoteMark } from './types'
import type { NotesDoc } from './notes-doc'

export interface SessionNotePayload {
  /** Plain-text derivative (for BW-compat / AI / search). */
  content: string
  /** Structured editor JSON — only the document content, never editor history/selection/UI state. */
  doc: NotesDoc
  marks: NoteMark[]
  authorId: string
  workspaceId: string
  updatedAtMs: number
}

/** Upserts the author's notebook for a session. Dotted field path updates just that author's slot. */
export async function saveSessionNote(sessionId: string, note: SessionNotePayload): Promise<void> {
  const value = {
    content: note.content,
    doc: note.doc,
    format: 'tiptap' as const,
    marks: note.marks,
    author_id: note.authorId,
    workspace_id: note.workspaceId,
    updated_at_ms: note.updatedAtMs,
  }
  await updateDoc(doc(getDb(), 'sessions', sessionId), {
    [`user_notes.${note.authorId}`]: value,
    updated_at: serverTimestamp(),
  })
}
