'use client'

/**
 * Tabs block — ONE persisted Tiptap node (`tabs`) whose children are `tab` nodes, each holding its own
 * real block content. Because every tab is a genuine node in the document, ALL tabs' content is in the
 * canonical JSON regardless of which tab is active — the active index is just UI state (persisted
 * harmlessly). Switching tabs toggles CSS visibility; it never unmounts/serializes-away hidden content.
 *
 * Controls: double-click a tab name to rename, `+` to add, and a per-tab menu to delete / move. On
 * compact surfaces the editing chrome is hidden (switch + "Open full note" only), never flattening.
 */
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps, type Editor } from '@tiptap/react'
import { Fragment } from '@tiptap/pm/model'
import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useEditorSurface } from './editor-surface'
import { cn } from '@/lib/utils'

/** A single tab: a titled container of arbitrary block content. */
export const Tab = Node.create({
  name: 'tab',
  group: 'tabItem',
  content: 'block+',
  defining: true,
  isolating: true,
  addAttributes() {
    return { title: { default: 'Tab' } }
  },
  parseHTML() {
    return [{ tag: 'div[data-tab]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-tab': '' }, 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(TabPanelView)
  },
})

export const TabsBlock = Node.create({
  name: 'tabs',
  group: 'block',
  content: 'tab+',
  draggable: true,
  selectable: true,
  addAttributes() {
    return { active: { default: 0 } }
  },
  parseHTML() {
    return [{ tag: 'div[data-tabs]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-tabs': '' }, 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(TabsView)
  },
})

/** Inserts a tabs block with three starter tabs, each seeded with an empty paragraph. */
export function insertTabs(editor: Editor, range: { from: number; to: number }) {
  const tab = (title: string) => ({ type: 'tab', attrs: { title }, content: [{ type: 'paragraph' }] })
  editor.chain().focus().deleteRange(range).insertContent({ type: 'tabs', attrs: { active: 0 }, content: [tab('Tab 1'), tab('Tab 2'), tab('Tab 3')] }).run()
}

/** The tab-panel container — just wraps its own content; the parent toggles its visibility. */
function TabPanelView() {
  return (
    <NodeViewWrapper className="recall-tab-panel" data-tab-panel="">
      <NodeViewContent />
    </NodeViewWrapper>
  )
}

function TabsView({ node, updateAttributes, editor, getPos, deleteNode }: NodeViewProps) {
  const surface = useEditorSurface()
  const navigate = useNavigate()
  const panelsRef = useRef<HTMLDivElement>(null)
  const [renaming, setRenaming] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const count = node.childCount
  const active = Math.max(0, Math.min(Number(node.attrs.active) || 0, count - 1))
  const editable = editor.isEditable && !surface.compact

  const titles: string[] = []
  for (let i = 0; i < count; i++) titles.push(String(node.child(i).attrs.title ?? `Tab ${i + 1}`))

  // Show only the active panel. Runs whenever active/count change (add/remove/switch all re-render
  // this parent view — child tab views don't re-render on the parent's attr change, which is exactly
  // why visibility is driven from here). Hidden panels stay in the document, so content always
  // persists. Tiptap nests the real content element two wrappers deep
  // (.recall-tabs-panels > [data-node-view-content] > [data-node-view-content-react] > <tab wrapper>*),
  // and `:scope >` keeps us to THIS block's tabs (nested tabs live deeper).
  useLayoutEffect(() => {
    const root = panelsRef.current
    if (!root) return
    const wrappers = root.querySelectorAll<HTMLElement>(':scope > [data-node-view-content] > [data-node-view-content-react] > *')
    const list = wrappers.length ? Array.from(wrappers) : Array.from((root.firstElementChild?.firstElementChild ?? root.firstElementChild)?.children ?? [])
    list.forEach((el, i) => {
      ;(el as HTMLElement).style.display = i === active ? '' : 'none'
    })
  })

  // ---- position helpers ---------------------------------------------------------------------------
  const tabPos = (index: number): number => {
    let pos = (getPos() as number) + 1
    for (let i = 0; i < index; i++) pos += node.child(i).nodeSize
    return pos
  }

  function selectTab(i: number) {
    updateAttributes({ active: i })
  }

  function commitRename(i: number) {
    const title = renameValue.trim() || `Tab ${i + 1}`
    setRenaming(null)
    editor.view.dispatch(editor.state.tr.setNodeAttribute(tabPos(i), 'title', title))
  }

  function addTab() {
    const tabType = editor.schema.nodes.tab
    const para = editor.schema.nodes.paragraph.create()
    const newTab = tabType.create({ title: `Tab ${count + 1}` }, para)
    const endPos = (getPos() as number) + node.nodeSize - 1
    editor.view.dispatch(editor.state.tr.insert(endPos, newTab))
    updateAttributes({ active: count }) // the new tab's index
  }

  function deleteTab(i: number) {
    if (count <= 1) return
    const from = tabPos(i)
    editor.view.dispatch(editor.state.tr.delete(from, from + node.child(i).nodeSize))
    updateAttributes({ active: Math.max(0, Math.min(active, count - 2)) })
  }

  function moveTab(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= count) return
    const children = []
    for (let k = 0; k < count; k++) children.push(node.child(k))
    ;[children[i], children[j]] = [children[j], children[i]]
    const from = (getPos() as number) + 1
    const to = (getPos() as number) + node.nodeSize - 1
    editor.view.dispatch(editor.state.tr.replaceWith(from, to, Fragment.fromArray(children)))
    updateAttributes({ active: j })
  }

  return (
    <NodeViewWrapper className="recall-tabs">
      <div className="recall-tabs-bar flex items-center gap-1 border-b border-border-subtle" contentEditable={false}>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {titles.map((title, i) =>
            renaming === i ? (
              <input
                key={i}
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(i)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(i); if (e.key === 'Escape') setRenaming(null) }}
                className="w-24 rounded-md border border-border-accent bg-surface-raised px-2 py-1 text-small text-foreground outline-none"
              />
            ) : (
              <div key={i} className="group/tab flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => selectTab(i)}
                  onDoubleClick={() => editable && (setRenaming(i), setRenameValue(title))}
                  className={cn(
                    'focus-ring relative rounded-md px-2.5 py-1.5 text-small transition-fast',
                    i === active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {title}
                  {i === active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
                </button>
                {editable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button type="button" aria-label={`${title} options`} className="focus-ring flex size-5 items-center justify-center rounded text-subtle-foreground opacity-0 transition-fast hover:text-foreground group-hover/tab:opacity-100 [&>svg]:size-3.5"><MoreHorizontal /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent width={160} placement="bottom-start">
                      <DropdownMenuItem onSelect={() => { setRenaming(i); setRenameValue(title) }}>Rename</DropdownMenuItem>
                      <DropdownMenuItem icon={<ChevronLeft />} disabled={i === 0} onSelect={() => moveTab(i, -1)}>Move left</DropdownMenuItem>
                      <DropdownMenuItem icon={<ChevronRight />} disabled={i === count - 1} onSelect={() => moveTab(i, 1)}>Move right</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem icon={<Trash2 />} danger disabled={count <= 1} onSelect={() => deleteTab(i)}>Delete tab</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ),
          )}
          {editable && (
            <button type="button" onClick={addTab} aria-label="Add tab" className="focus-ring ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-4"><Plus /></button>
          )}
        </div>
        {(surface.compact || !editable) && surface.openFullHref && (
          <button type="button" onClick={() => navigate(surface.openFullHref!)} className="shrink-0 px-2 text-caption font-medium text-foreground hover:underline">Open full note</button>
        )}
        {editable && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button type="button" aria-label="Tabs block options" className="focus-ring flex size-6 shrink-0 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-4"><MoreHorizontal /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent width={160} placement="bottom-end">
              <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => deleteNode()}>Delete tabs</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div ref={panelsRef} className="recall-tabs-panels">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
