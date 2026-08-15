'use client'

/**
 * "My Notes" — the calm Active Session surface, now a full Notion-style block editor (RichNotesEditor)
 * bound to the canonical ActiveSession note store. Same document the dock, PiP companion, and the
 * completed Session Notes tab edit — no duplicate state. Type "/" for the block menu.
 */
import { useNotesEditor } from '@/data/active-session/use-notes-editor'
import { RichNotesEditor } from './rich-notes-editor'

export function NotesNotebook() {
  const notes = useNotesEditor()

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col pb-28">
      <div className="mb-2 flex items-baseline justify-between">
        <h1 className="text-title font-semibold text-foreground">My Notes</h1>
        <span className="text-caption text-subtle-foreground transition-fast" aria-live="polite">
          {notes.saveLabel}
        </span>
      </div>
      <RichNotesEditor
        key={notes.sessionId ?? 'none'}
        initialDoc={notes.initialDoc}
        getDoc={notes.getDoc}
        subscribe={notes.subscribe}
        onChange={notes.onChange}
        onBlur={notes.onBlur}
        onMarkMoment={notes.onMarkMoment}
        autofocus
        className="min-h-[60vh] flex-1"
      />
    </div>
  )
}
