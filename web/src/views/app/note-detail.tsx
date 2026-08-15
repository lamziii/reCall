'use client'

/**
 * Standalone note editor (/app/notes/[id]). Reuses the SAME Tiptap editor as meeting notes — no second
 * editor. `/app/notes/new` creates a fresh personal note and redirects to its real id. Title + content
 * autosave (debounced); folder + favorite save immediately. Meeting notes never route here (they open
 * on their Session Notes tab), so this page only ever edits personal notes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from '@/lib/router-compat'
import { ArrowLeft, Star } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/forms/select'
import { RichNotesEditor } from '@/components/recording/rich-notes-editor'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { createNote, getNote, subscribeFolders, updateNote } from '@/data/notes/notes-store'
import type { NoteFolderDoc, PersonalNoteDoc } from '@/data/notes/note-model'
import { useNotesEditorOptions, notesWidthClass } from '@/data/notes/use-notes-editor-options'
import { useRecallPreferences } from '@/settings/settings-context'
import type { NotesDoc } from '@/data/active-session/notes-doc'
import { cn } from '@/lib/utils'

const SAVE_DEBOUNCE_MS = 1000

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const authorId = user?.id ?? 'unknown'

  const editorOptions = useNotesEditorOptions()
  const { preferences } = useRecallPreferences()

  const [note, setNote] = useState<PersonalNoteDoc | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'notfound'>('loading')
  const [folders, setFolders] = useState<NoteFolderDoc[]>([])

  const pending = useRef<{ title?: string; doc?: NotesDoc }>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingId = useRef<string | null>(null)

  useEffect(() => subscribeFolders(workspaceId, authorId, setFolders), [workspaceId, authorId])

  // Load the note — or, for `/app/notes/new`, create one and swap the URL to its real id.
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!id) return
      if (id === 'new') {
        const newId = await createNote({ workspaceId, authorId })
        if (!cancelled) navigate(`/app/notes/${newId}`, { replace: true })
        return
      }
      setStatus('loading')
      const loaded = await getNote(id)
      if (cancelled) return
      if (!loaded) {
        setStatus('notfound')
        return
      }
      savingId.current = loaded.id
      setNote(loaded)
      setStatus('saved')
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const flush = useCallback(async () => {
    const nid = savingId.current
    if (!nid || (pending.current.title === undefined && pending.current.doc === undefined)) return
    const patch = pending.current
    pending.current = {}
    setStatus('saving')
    try {
      await updateNote(nid, patch)
      setStatus('saved')
    } catch {
      setStatus('idle')
    }
  }, [])

  const scheduleSave = useCallback(() => {
    setStatus('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS)
  }, [flush])

  // Flush any pending edit on unmount so navigating away never drops the last keystrokes.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      void flush()
    }
  }, [flush])

  const initialDoc = useMemo(() => note?.doc ?? null, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' || id === 'new') {
    return <PageContainer><div className="py-16 text-center text-small text-subtle-foreground">Loading…</div></PageContainer>
  }
  if (status === 'notfound' || !note || !initialDoc) {
    return (
      <PageContainer>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            title="Note not found"
            description="This note may have been deleted."
            action={<Button variant="secondary" onClick={() => navigate('/app/notes')}>Back to Notes</Button>}
          />
        </div>
      </PageContainer>
    )
  }

  const widthClass = notesWidthClass(preferences.notes.editorWidth)

  return (
    <PageContainer>
      <div className={cn('mx-auto flex w-full flex-1 flex-col', widthClass)}>
        {/* Header: back · folder · favorite · save status */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/app/notes')}
            aria-label="Back to Notes"
            className="focus-ring flex size-8 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <Select
            aria-label="Folder"
            size="sm"
            value={note.folder_id ?? ''}
            onChange={(e) => {
              const folderId = e.target.value || null
              setNote((n) => (n ? { ...n, folder_id: folderId } : n))
              void updateNote(note.id, { folderId })
            }}
            options={[{ value: '', label: 'Uncategorized' }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
            className="w-44"
          />
          <button
            type="button"
            onClick={() => {
              const favorite = !note.favorite
              setNote((n) => (n ? { ...n, favorite } : n))
              void updateNote(note.id, { favorite })
            }}
            aria-pressed={note.favorite}
            aria-label={note.favorite ? 'Remove favorite' : 'Add to favorites'}
            className={cn(
              'focus-ring flex size-8 items-center justify-center rounded-md transition-fast hover:bg-surface-hover',
              note.favorite ? 'text-warning' : 'text-subtle-foreground hover:text-foreground',
            )}
          >
            <Star className={cn('size-4', note.favorite && 'fill-warning')} />
          </button>
          <span className="ml-auto text-caption text-subtle-foreground" aria-live="polite">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
          </span>
        </div>

        {/* Title */}
        <input
          type="text"
          defaultValue={note.title}
          placeholder="Untitled"
          aria-label="Note title"
          onChange={(e) => {
            pending.current.title = e.target.value
            scheduleSave()
          }}
          className="mb-2 w-full bg-transparent text-h2 font-semibold text-foreground outline-none placeholder:text-subtle-foreground"
        />

        {/* Editor — the SAME Tiptap editor as meeting notes. */}
        <RichNotesEditor
          key={note.id}
          initialDoc={initialDoc}
          onChange={(doc) => {
            pending.current.doc = doc
            scheduleSave()
          }}
          options={editorOptions}
          autofocus
          placeholder="Start writing…  /  for blocks"
          className="recall-notes-roomy flex-1"
        />
      </div>
    </PageContainer>
  )
}
