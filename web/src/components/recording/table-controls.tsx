'use client'

/**
 * Contextual table controls — a subtle ••• button pinned to the top-right of the active table.
 * Clicking opens a small popover of Tiptap's built-in structural commands. Rendered into the
 * editor's OWN document so it also works inside the Document PiP window (though callers hide it on
 * compact surfaces). No large per-table toolbar.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Anchor {
  top: number
  left: number
  doc: Document
}

function findTableAnchor(editor: Editor): Anchor | null {
  const { from } = editor.state.selection
  const dom = editor.view.domAtPos(from).node
  const el = dom instanceof HTMLElement ? dom : dom.parentElement
  const table = el?.closest('table')
  if (!table) return null
  const box = (table.closest('.tableWrapper') ?? table).getBoundingClientRect()
  return { top: box.top, left: box.right, doc: table.ownerDocument }
}

export function TableControls({ editor }: { editor: Editor }) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const update = useCallback(() => {
    if (!editor.isActive('table')) {
      setAnchor(null)
      setOpen(false)
      return
    }
    setAnchor(findTableAnchor(editor))
  }, [editor])

  useEffect(() => {
    update()
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    const doc = editor.view.dom.ownerDocument
    doc.addEventListener('scroll', update, true)
    doc.defaultView?.addEventListener('resize', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
      doc.removeEventListener('scroll', update, true)
      doc.defaultView?.removeEventListener('resize', update)
    }
  }, [editor, update])

  // Close the popover on an outside click.
  useEffect(() => {
    if (!open || !anchor) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    anchor.doc.addEventListener('mousedown', onDown)
    return () => anchor.doc.removeEventListener('mousedown', onDown)
  }, [open, anchor])

  if (!anchor) return null

  const run = (fn: () => void) => () => {
    fn()
    setOpen(false)
  }

  const actions: { label: string; icon: React.ReactNode; run: () => void; danger?: boolean }[] = [
    { label: 'Add row above', icon: <ArrowUpToLine />, run: run(() => editor.chain().focus().addRowBefore().run()) },
    { label: 'Add row below', icon: <ArrowDownToLine />, run: run(() => editor.chain().focus().addRowAfter().run()) },
    { label: 'Delete row', icon: <Trash2 />, run: run(() => editor.chain().focus().deleteRow().run()) },
    { label: 'Add column left', icon: <ArrowLeftToLine />, run: run(() => editor.chain().focus().addColumnBefore().run()) },
    { label: 'Add column right', icon: <ArrowRightToLine />, run: run(() => editor.chain().focus().addColumnAfter().run()) },
    { label: 'Delete column', icon: <Trash2 />, run: run(() => editor.chain().focus().deleteColumn().run()) },
    { label: 'Delete table', icon: <Trash2 />, run: run(() => editor.chain().focus().deleteTable().run()), danger: true },
  ]

  return createPortal(
    <div
      ref={rootRef}
      style={{ position: 'fixed', top: anchor.top, left: anchor.left, transform: 'translate(-100%, -50%)', zIndex: 60 }}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        aria-label="Table options"
        aria-expanded={open}
        className="focus-ring flex size-6 items-center justify-center rounded-md border border-border bg-surface-raised text-subtle-foreground shadow-sm transition-fast hover:text-foreground [&>svg]:size-3.5"
      >
        <MoreHorizontal />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-7 w-44 overflow-hidden rounded-lg border border-border bg-surface-raised p-1 shadow-lg"
        >
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onMouseDown={(e) => {
                e.preventDefault()
                a.run()
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-small transition-fast hover:bg-surface-hover [&>svg]:size-3.5 [&>svg]:shrink-0',
                a.danger ? 'text-danger' : 'text-muted-foreground hover:text-foreground',
                i === 3 && 'mt-1 border-t border-border-subtle pt-2',
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>,
    anchor.doc.body,
  )
}
