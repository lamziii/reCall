'use client'

/**
 * Internal note link — an atomic INLINE Tiptap node that references another Recall note by its STABLE
 * id (never its title), so renaming the destination never breaks the link. `label` is a display
 * snapshot (also what the AI plain-text sees); navigation always uses the id. Inserted via the
 * `/link to note` slash command, which drops a `pending` node whose NodeView opens a search picker.
 *
 * Backlinks seam: because every link stores { noteId, source, sessionId }, a future backlinks index can
 * be built by scanning docs for `noteLink` nodes — no schema change here.
 */
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps, type Editor } from '@tiptap/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { ArrowUpRight, FileText, Search, Video } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotes } from '@/data/notes/use-notes'
import { displayTitle, searchNotes, sortNotes, type NoteListItem } from '@/data/notes/note-model'
import { useEditorSurface } from './editor-surface'

export interface NoteLinkAttrs {
  noteId: string | null
  source: 'personal' | 'meeting'
  sessionId: string | null
  label: string
  pending: boolean
}

export const NoteLink = Node.create({
  name: 'noteLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      noteId: { default: null },
      source: { default: 'personal' },
      sessionId: { default: null },
      label: { default: '' },
      // Transient: a freshly-inserted link opens its picker; cleared once a target is chosen. Persisted
      // harmlessly (a reloaded pending link simply re-opens the picker, or is deleted on dismiss).
      pending: { default: false },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-note-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const label = (HTMLAttributes.label as string) || 'Untitled'
    return ['a', mergeAttributes(HTMLAttributes, { 'data-note-link': '', class: 'recall-note-link' }), `↗ ${label}`]
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteLinkView)
  },
})

function NoteLinkView({ node, updateAttributes, editor, getPos, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as unknown as NoteLinkAttrs
  const navigate = useNavigate()
  const surface = useEditorSurface()
  const [open, setOpen] = useState(Boolean(attrs.pending) && !surface.compact && editor.isEditable)

  function choose(item: NoteListItem) {
    updateAttributes({
      noteId: item.noteId ?? item.id,
      source: item.source,
      sessionId: item.sessionId ?? null,
      label: displayTitle(item.title),
      pending: false,
    })
    setOpen(false)
    // Keep typing after the chip.
    if (typeof getPos === 'function') editor.commands.focus()
  }

  function dismiss() {
    setOpen(false)
    // A pending link with no target is noise — remove it on dismiss.
    if (!attrs.noteId) deleteNode()
    else updateAttributes({ pending: false })
  }

  function openTarget() {
    if (attrs.source === 'meeting' && attrs.sessionId) navigate(`/app/notes/session/${attrs.sessionId}`)
    else if (attrs.noteId) navigate(`/app/notes/${attrs.noteId}`)
  }

  const chip = (
    <NodeViewWrapper as="span" className="recall-note-link-wrap">
      <button
        type="button"
        contentEditable={false}
        onClick={() => (attrs.noteId ? openTarget() : setOpen(true))}
        className="recall-note-link focus-ring inline-flex max-w-full items-center gap-1 rounded-md px-1 align-baseline text-inherit"
        title={attrs.label ? `Open “${attrs.label}”` : 'Choose a note'}
      >
        {attrs.source === 'meeting' ? <Video className="size-3.5 shrink-0 opacity-70" /> : <FileText className="size-3.5 shrink-0 opacity-70" />}
        <span className="truncate">{attrs.label || 'Choose a note…'}</span>
        {attrs.noteId && <ArrowUpRight className="size-3 shrink-0 opacity-60" />}
      </button>
    </NodeViewWrapper>
  )

  // Compact / read-only surfaces never open the picker — the chip is display-only.
  if (surface.compact || !editor.isEditable) return chip

  return (
    <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <PopoverTrigger>{chip}</PopoverTrigger>
      <PopoverContent placement="bottom-start" trapFocus width={320} className="p-0">
        <NoteLinkPicker onSelect={choose} />
      </PopoverContent>
    </Popover>
  )
}

function NoteLinkPicker({ onSelect }: { onSelect: (item: NoteListItem) => void }) {
  const notes = useNotes()
  const [query, setQuery] = useState('')
  const folderName = useMemo(() => new Map(notes.folders.map((f) => [f.id, f.name])), [notes.folders])
  const results = useMemo(() => sortNotes(searchNotes(notes.items, query), 'updated').slice(0, 30), [notes.items, query])

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-2.5 py-2">
        <Search className="size-4 shrink-0 text-subtle-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Link to a note…"
          className="min-w-0 flex-1 bg-transparent text-small text-foreground outline-none placeholder:text-subtle-foreground"
        />
      </div>
      <ul className="max-h-64 overflow-y-auto p-1.5">
        {results.length === 0 ? (
          <li className="px-2.5 py-4 text-center text-caption text-subtle-foreground">{query ? 'No matching notes.' : 'Type to search your notes.'}</li>
        ) : (
          results.map((item) => {
            // Context to disambiguate duplicate titles: source + folder.
            const context = item.source === 'meeting' ? 'Meeting note' : item.folderId ? folderName.get(item.folderId) ?? 'Folder' : 'Notes'
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-fast hover:bg-surface-hover"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center text-subtle-foreground [&>svg]:size-4">
                    {item.icon ? <span className="text-[1rem] leading-none">{item.icon}</span> : item.source === 'meeting' ? <Video /> : <FileText />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-small font-medium text-foreground">{displayTitle(item.title)}</span>
                    <span className="truncate text-caption text-subtle-foreground">{context}</span>
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

/** Inserts a pending note-link at the current selection (its NodeView opens the picker). */
export function insertNoteLink(editor: Editor, range: { from: number; to: number }) {
  editor.chain().focus().deleteRange(range).insertContent({ type: 'noteLink', attrs: { pending: true } }).run()
}
