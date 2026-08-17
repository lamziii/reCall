'use client'

/**
 * /app/notes landing. Notes always keeps one note open, so this never shows a list: it opens the most
 * recently edited note (deep-link-safe — a refresh here re-resolves), or, when the workspace has no
 * notes yet, a calm empty state that creates the first one in a single click.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { NotebookText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotes } from '@/data/notes/use-notes'
import { sortNotes } from '@/data/notes/note-model'
import { itemPath } from './routes'

export function NotesIndex() {
  const notes = useNotes()
  const navigate = useNavigate()
  const redirected = useRef(false)

  const mostRecent = notes.items.length ? sortNotes(notes.items, 'updated')[0] : null

  useEffect(() => {
    if (redirected.current || notes.loading || !mostRecent) return
    redirected.current = true
    navigate(itemPath(mostRecent), { replace: true })
  }, [notes.loading, mostRecent, navigate])

  async function createFirst() {
    const id = await notes.createNote(null)
    navigate(`/app/notes/${id}`)
  }

  if (notes.loading || mostRecent) {
    return <div className="flex flex-1 items-center justify-center text-small text-subtle-foreground">Loading your notes…</div>
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-raised text-subtle-foreground [&>svg]:size-7">
        <NotebookText />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h2 font-semibold text-foreground">Your notes live here</h1>
        <p className="max-w-sm text-small text-muted-foreground">A focused writing space. Standalone notes and notes from your meetings, all in one place.</p>
      </div>
      <Button leftIcon={<Plus />} onClick={createFirst}>Create your first note</Button>
    </div>
  )
}
