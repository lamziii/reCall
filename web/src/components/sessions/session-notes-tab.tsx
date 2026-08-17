'use client'

/**
 * Notes tab for the completed Session Review. Shows the user's OWN notebook captured during the live
 * meeting, now with the SAME rich block editor (RichNotesEditor), still editable afterward.
 *
 * ONE source of truth: reads/writes the exact `sessions/{id}.user_notes.{authorId}` field the Active
 * Session / dock / PiP wrote — via saveSessionNote. Legacy plain-text notes render correctly
 * (migration-on-read via toNotesDoc). Existing 'moment' marks are preserved on edit.
 */
import { useMemo, useRef, useState } from 'react'
import { Flag } from 'lucide-react'
import { Small } from '@/components/typography'
import { useAuth } from '@/lib/auth/auth-context'
import { RichNotesEditor } from '@/components/recording/rich-notes-editor'
import { saveSessionNote } from '@/data/active-session/notes-store'
import { toNotesDoc, type NotesDoc } from '@/data/active-session/notes-doc'
import { useNotesEditorOptions } from '@/data/notes/use-notes-editor-options'
import { useRecallPreferences } from '@/settings/settings-context'
import type { SessionUserNoteDoc } from '@/data/live/types'

const SAVE_DEBOUNCE_MS = 1500

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SessionNotesTab({
  sessionId,
  workspaceId,
  userNotes,
}: {
  sessionId: string
  workspaceId: string
  userNotes: Record<string, SessionUserNoteDoc> | undefined
}) {
  const { user } = useAuth()
  const authorId = user?.id ?? 'unknown'
  const note = userNotes?.[authorId]
  const editorOptions = useNotesEditorOptions()
  const { preferences } = useRecallPreferences()

  // Seed once (migration-on-read: legacy plain-text → doc). Marks preserved on save.
  const initialDoc = useMemo(() => toNotesDoc(note), [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps
  const marksRef = useRef(note?.marks ?? [])
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function persist(doc: NotesDoc, plainText: string) {
    setSaveState('saving')
    try {
      await saveSessionNote(sessionId, {
        content: plainText,
        doc,
        marks: marksRef.current, // preserve line + moment marks
        authorId,
        workspaceId,
        updatedAtMs: Date.now(),
      })
      setSaveState('saved')
    } catch {
      setSaveState('idle')
    }
  }

  function handleChange(doc: NotesDoc, plainText: string) {
    setSaveState('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void persist(doc, plainText), SAVE_DEBOUNCE_MS)
  }

  const moments = (marksRef.current ?? [])
    .filter((m) => m.kind === 'moment')
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-title font-semibold text-foreground">My Notes</h2>
          <Small className="text-subtle-foreground">Notes you captured during this session.</Small>
        </div>
        <span className="text-caption text-subtle-foreground transition-fast" aria-live="polite">
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
        </span>
      </div>

      {/* The user's own notebook — quiet, distinct from AI review content. Editable after the meeting. */}
      <div className="min-h-[280px] rounded-lg border border-border-subtle bg-surface p-4">
        <RichNotesEditor
          key={sessionId}
          initialDoc={initialDoc}
          onChange={handleChange}
          options={editorOptions}
          uploadTarget={{ workspaceId, authorId, noteId: sessionId }}
          placeholder="You didn't capture notes during this session. You can add them here.  /  for blocks"
          className="min-h-[240px]"
        />
      </div>

      {preferences.notes.showMarkedMoments && moments.length > 0 && (
        <div className="flex flex-col gap-2">
          <Small className="font-medium text-subtle-foreground">Marked moments</Small>
          <ul className="flex flex-col gap-1.5">
            {moments.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-small text-muted-foreground">
                <Flag className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
                {preferences.notes.showMeetingTimestamps && <span className="tabular-nums text-subtle-foreground">{fmt(m.timestamp_seconds)}</span>}
                {preferences.notes.showMeetingTimestamps && <span aria-hidden className="text-subtle-foreground">·</span>}
                <span>Marked moment</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
