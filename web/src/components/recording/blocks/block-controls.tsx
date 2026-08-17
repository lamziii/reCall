'use client'

/**
 * BlockControls — the left-gutter block chrome (Notion-style). Renders a `+` insert control and a
 * six-dot drag handle next to the hovered/focused block, using Tiptap's official DragHandle extension
 * (real ProseMirror drag + dropcursor, no DOM hacks). The handle:
 *   - drags the whole block above/below/between others (complex blocks: tables, tabs, charts, media…),
 *   - click → selects the block as a NodeSelection (subtle .ProseMirror-selectednode styling),
 *   - opens a small block menu: Turn into / Duplicate / Move up / Move down / Delete.
 *
 * Only mounted on full surfaces (never the compact dock/PiP), same as TableControls.
 */
import { useRef, useState } from 'react'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import { offset } from '@floating-ui/dom'
import { Fragment } from '@tiptap/pm/model'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import { GripVertical, Plus, Copy, Trash2, ArrowUp, ArrowDown, Repeat2, Type, Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Quote } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/** Block types that can be re-typed via "Turn into". Atoms (chart/media/tabs/etc.) are excluded. */
const TURN_INTO_TYPES = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList', 'blockquote', 'codeBlock'])

interface TurnIntoOption {
  label: string
  icon: React.ReactNode
  run: (editor: Editor) => void
}
const TURN_INTO: TurnIntoOption[] = [
  { label: 'Text', icon: <Type />, run: (e) => e.chain().focus().setParagraph().run() },
  { label: 'Heading 1', icon: <Heading1 />, run: (e) => e.chain().focus().setNode('heading', { level: 1 }).run() },
  { label: 'Heading 2', icon: <Heading2 />, run: (e) => e.chain().focus().setNode('heading', { level: 2 }).run() },
  { label: 'Heading 3', icon: <Heading3 />, run: (e) => e.chain().focus().setNode('heading', { level: 3 }).run() },
  { label: 'Bullet list', icon: <List />, run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered list', icon: <ListOrdered />, run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'To-do list', icon: <ListTodo />, run: (e) => e.chain().focus().toggleTaskList().run() },
  { label: 'Quote', icon: <Quote />, run: (e) => e.chain().focus().toggleBlockquote().run() },
]

export function BlockControls({ editor }: { editor: Editor }) {
  const [node, setNode] = useState<PMNode | null>(null)
  const posRef = useRef(-1)
  const [open, setOpen] = useState(false)
  const [turnInto, setTurnInto] = useState(false)

  function closeMenu() {
    setOpen(false)
    setTurnInto(false)
  }

  /** Select the whole block as a NodeSelection (drives .ProseMirror-selectednode styling). */
  function selectBlock() {
    const pos = posRef.current
    if (pos < 0) return
    editor.chain().setNodeSelection(pos).run()
  }

  function insertBelow() {
    const n = node
    const pos = posRef.current
    if (!n || pos < 0) return
    const at = pos + n.nodeSize
    editor.chain().focus().insertContentAt(at, { type: 'paragraph' }).setTextSelection(at + 1).run()
  }

  function duplicate() {
    const n = node
    const pos = posRef.current
    if (!n || pos < 0) return
    editor.chain().focus().insertContentAt(pos + n.nodeSize, n.toJSON()).run()
    closeMenu()
  }

  function remove() {
    const pos = posRef.current
    if (pos < 0) return
    editor.chain().focus().setNodeSelection(pos).deleteSelection().run()
    closeMenu()
  }

  /** Swap this block with its previous/next sibling (mirrors the safe replaceWith reorder in tabs). */
  function move(dir: -1 | 1) {
    const pos = posRef.current
    if (pos < 0) return
    const { state, view } = editor
    const $pos = state.doc.resolve(pos)
    const parent = $pos.parent
    const index = $pos.index()
    const target = index + dir
    if (target < 0 || target >= parent.childCount) return
    const children: PMNode[] = []
    for (let k = 0; k < parent.childCount; k++) children.push(parent.child(k))
    ;[children[index], children[target]] = [children[target], children[index]]
    const start = $pos.start()
    view.dispatch(state.tr.replaceWith(start, start + parent.content.size, Fragment.fromArray(children)))
    closeMenu()
  }

  function turnIntoRun(run: (e: Editor) => void) {
    const pos = posRef.current
    if (pos < 0) return
    editor.chain().focus().setTextSelection(pos + 1).run()
    run(editor)
    closeMenu()
  }

  const canTurnInto = node ? TURN_INTO_TYPES.has(node.type.name) : false

  return (
    <DragHandle
      editor={editor}
      className="recall-block-handle"
      // Nested targeting: default rules make an individual list item (not the whole list) the drag
      // target, exclude table rows/cells, etc. crossAxis offset nudges the handle down toward the
      // first line's vertical center (top-aligned reads too high on tall blocks like H1).
      nested
      computePositionConfig={{ placement: 'left-start', middleware: [offset({ mainAxis: 14, crossAxis: 5 })] }}
      onNodeChange={({ node: n, pos }) => {
        setNode(n)
        posRef.current = pos
      }}
    >
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Insert block below"
          onClick={insertBelow}
          className="flex size-5 items-center justify-center rounded text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-4"
        >
          <Plus />
        </button>
        <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) selectBlock(); else setTurnInto(false) }}>
          <DropdownMenuTrigger>
            <button
              type="button"
              aria-label="Block options — drag to move"
              className="flex h-5 w-4 cursor-grab items-center justify-center rounded text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground active:cursor-grabbing [&>svg]:size-4"
            >
              <GripVertical />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent width={188} placement="bottom-start">
            {turnInto ? (
              <>
                <DropdownMenuLabel>Turn into</DropdownMenuLabel>
                {TURN_INTO.map((o) => (
                  <DropdownMenuItem key={o.label} icon={o.icon} onSelect={() => turnIntoRun(o.run)}>{o.label}</DropdownMenuItem>
                ))}
              </>
            ) : (
              <>
                {canTurnInto && <DropdownMenuItem icon={<Repeat2 />} onSelect={() => setTurnInto(true)}>Turn into…</DropdownMenuItem>}
                <DropdownMenuItem icon={<Copy />} onSelect={duplicate}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem icon={<ArrowUp />} onSelect={() => move(-1)}>Move up</DropdownMenuItem>
                <DropdownMenuItem icon={<ArrowDown />} onSelect={() => move(1)}>Move down</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<Trash2 />} danger onSelect={remove}>Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DragHandle>
  )
}
