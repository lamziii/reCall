'use client'

import { useCallback, useMemo } from 'react'
import { useActiveSession } from './active-session-context'
import type { NotesDoc } from './notes-doc'

/**
 * Binds a RichNotesEditor to the canonical ActiveSession notes. Every notes surface (record page,
 * expandable dock, PiP companion) uses this, so they all edit the SAME structured document with no
 * duplicate state: onChange writes the doc + derived plain text to the store; subscribe/getDoc let
 * an idle editor re-sync when another surface edits. Marks (moments) are managed by the store.
 */
export function useNotesEditor() {
  const session = useActiveSession()

  // Seed once per session (RichNotesEditor is keyed by sessionId, so it remounts fresh per session).
  const initialDoc = useMemo(() => session.getNotesDoc(), [session.sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = useCallback(
    (doc: NotesDoc, plainText: string) => session.updateNotes(doc, plainText),
    [session],
  )
  const onBlur = useCallback(() => void session.flushNotes(), [session])

  return {
    sessionId: session.sessionId,
    initialDoc,
    getDoc: session.getNotesDoc,
    subscribe: session.subscribeNotes,
    onChange,
    onBlur,
    onMarkMoment: session.markMoment,
    saveLabel:
      session.noteSaveState === 'saving' ? 'Saving…' : session.noteSaveState === 'saved' ? 'Saved' : '',
  }
}
