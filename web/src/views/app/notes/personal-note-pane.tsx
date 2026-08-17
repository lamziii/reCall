'use client'

/**
 * PersonalNotePane (/app/notes/[id]) — the editor for a standalone personal note. Reuses the SAME
 * Tiptap editor as meeting notes via NoteEditorFrame. `/app/notes/new` creates a fresh note and
 * redirects to its real id. Title + content autosave (debounced); icon/favorite/folder/trash save
 * immediately. Delete moves the note to Trash (recoverable) — it is never hard-deleted here.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from '@/lib/router-compat'
import { Check, Copy, MoreHorizontal, Star, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { createNote, getNote, subscribeFolders, updateNote } from '@/data/notes/notes-store'
import { asPaperStyle, displayTitle, type NoteFolderDoc, type PersonalNoteDoc } from '@/data/notes/note-model'
import type { NotesDoc } from '@/data/active-session/notes-doc'
import { useRecallPreferences } from '@/settings/settings-context'
import { PageStyleItems } from '@/components/notes/page-style-menu'
import { NOTES_BASE, notePath } from './routes'
import { NoteEditorFrame, type Crumb } from './note-editor-frame'

const SAVE_DEBOUNCE_MS = 1000

/** Walks folder → parent chain into ordered breadcrumb labels (root first). */
function folderCrumbs(folders: NoteFolderDoc[], folderId: string | null): string[] {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const out: string[] = []
  const seen = new Set<string>()
  let cur = folderId
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const f = byId.get(cur)
    if (!f) break
    out.unshift(f.name)
    cur = f.parent_id ?? null
  }
  return out
}

export function PersonalNotePane() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const { preferences } = useRecallPreferences()
  const authorId = user?.id ?? 'unknown'

  const [note, setNote] = useState<PersonalNoteDoc | null>(null)
  const [status, setStatus] = useState<'loading' | 'saving' | 'saved' | 'notfound'>('loading')
  const [folders, setFolders] = useState<NoteFolderDoc[]>([])

  const pending = useRef<{ title?: string; doc?: NotesDoc }>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingId = useRef<string | null>(null)

  useEffect(() => subscribeFolders(workspaceId, authorId, setFolders), [workspaceId, authorId])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!id) return
      if (id === 'new') {
        const newId = await createNote({ workspaceId, authorId, paperStyle: preferences.notes.defaultPaperStyle })
        if (!cancelled) navigate(notePath(newId), { replace: true })
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
      setStatus('saving')
    }
  }, [])

  const scheduleSave = useCallback(() => {
    setStatus('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS)
  }, [flush])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      void flush()
    }
  }, [flush])

  const initialDoc = useMemo(() => note?.doc ?? null, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' || id === 'new') {
    return <div className="flex flex-1 items-center justify-center text-small text-subtle-foreground">Loading…</div>
  }
  if (status === 'notfound' || !note || !initialDoc) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          title="Note not found"
          description="This note may have been deleted."
          action={<Button variant="secondary" onClick={() => navigate(NOTES_BASE)}>Back to Notes</Button>}
        />
      </div>
    )
  }

  const crumbs: Crumb[] = [{ label: 'Notes', to: NOTES_BASE }, ...folderCrumbs(folders, note.folder_id ?? null).map((label) => ({ label }))]

  async function duplicate() {
    const copyId = await createNote({ workspaceId, authorId, title: `${displayTitle(note!.title)} (copy)`, folderId: note!.folder_id ?? null, doc: note!.doc, paperStyle: asPaperStyle(note!.paper_style) })
    navigate(notePath(copyId))
  }

  async function moveToTrash() {
    await updateNote(note!.id, { trashed: true })
    navigate(NOTES_BASE)
  }

  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button type="button" aria-label="Note actions" className="focus-ring flex size-8 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-4">
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent width={200} placement="bottom-end">
        <DropdownMenuItem
          icon={<Star />}
          onSelect={() => {
            const favorite = !note.favorite
            setNote((n) => (n ? { ...n, favorite } : n))
            void updateNote(note.id, { favorite })
          }}
        >
          {note.favorite ? 'Remove favorite' : 'Add to favorites'}
        </DropdownMenuItem>
        <DropdownMenuItem icon={<Copy />} onSelect={duplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <PageStyleItems
          value={asPaperStyle(note.paper_style)}
          onChange={(paper) => { setNote((n) => (n ? { ...n, paper_style: paper } : n)); void updateNote(note.id, { paperStyle: paper }) }}
        />
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
        <DropdownMenuItem
          icon={note.folder_id === null ? <Check /> : undefined}
          onSelect={() => { setNote((n) => (n ? { ...n, folder_id: null } : n)); void updateNote(note.id, { folderId: null }) }}
        >
          Uncategorized
        </DropdownMenuItem>
        {folders.map((f) => (
          <DropdownMenuItem
            key={f.id}
            icon={note.folder_id === f.id ? <Check /> : undefined}
            onSelect={() => { setNote((n) => (n ? { ...n, folder_id: f.id } : n)); void updateNote(note.id, { folderId: f.id }) }}
          >
            {f.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Trash2 />} danger onSelect={moveToTrash}>Move to Trash</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <NoteEditorFrame
      titleKey={note.id}
      crumbs={crumbs}
      icon={note.icon ?? null}
      onIconChange={(icon) => { setNote((n) => (n ? { ...n, icon } : n)); void updateNote(note.id, { icon }) }}
      title={note.title}
      onTitleChange={(title) => { pending.current.title = title; scheduleSave() }}
      actions={actions}
      saveLabel={status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
      initialDoc={initialDoc}
      onDocChange={(doc) => { pending.current.doc = doc; scheduleSave() }}
      paperStyle={asPaperStyle(note.paper_style)}
    />
  )
}
