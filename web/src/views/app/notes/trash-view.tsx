'use client'

/**
 * /app/notes/trash — soft-deleted notes with Restore / Delete permanently. Only personal notes ever
 * land here; a meeting note's content is its Session's, so it can't be trashed (and deleting from here
 * never touches a Session). Deleting permanently is the only hard delete in Notes.
 */
import { useState } from 'react'
import { RotateCcw, Trash2, NotebookText } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNotes } from '@/data/notes/use-notes'
import { displayTitle, notePreview, sortNotes, type NoteListItem } from '@/data/notes/note-model'
import { formatRelativeTime } from '@/data/home/format'

function relative(ms: number): string {
  try { return formatRelativeTime(new Date(ms).toISOString()) } catch { return '' }
}

export function TrashView() {
  const notes = useNotes()
  const [purge, setPurge] = useState<NoteListItem | null>(null)
  const items = sortNotes(notes.trashedItems, 'updated')

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h2 font-semibold text-foreground">Trash</h1>
        <p className="text-small text-muted-foreground">Deleted notes are kept here until you remove them permanently.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Trash2 />} title="Trash is empty" description="Notes you delete will appear here." />
      ) : (
        <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
          {items.map((item) => {
            const preview = notePreview(item.plainText)
            return (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-raised text-subtle-foreground [&>svg]:size-4">
                  {item.icon ? <span className="text-[1rem]">{item.icon}</span> : <NotebookText />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-small font-medium text-foreground">{displayTitle(item.title)}</span>
                  {preview && <span className="truncate text-caption text-muted-foreground">{preview}</span>}
                </div>
                <span className="hidden shrink-0 text-caption text-subtle-foreground sm:block">{relative(item.updatedAtMs)}</span>
                <button type="button" onClick={() => notes.restore(item)} className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-caption font-medium text-muted-foreground transition-fast hover:bg-surface-hover hover:text-foreground">
                  <RotateCcw className="size-3.5" /> Restore
                </button>
                <button type="button" aria-label="Delete permanently" onClick={() => setPurge(item)} className="focus-ring flex size-7 shrink-0 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-danger [&>svg]:size-4">
                  <Trash2 />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={purge !== null}
        onOpenChange={(o) => !o && setPurge(null)}
        title="Delete this note permanently?"
        description="This can't be undone. The note will be removed for good."
        confirmLabel="Delete permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => { if (purge) void notes.permanentDelete(purge); setPurge(null) }}
      />
    </div>
  )
}
