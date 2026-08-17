'use client'

/**
 * RichNotesEditor — the single Tiptap block editor used by EVERY notes surface (record page,
 * expandable dock, PiP companion, completed Session Notes tab). It never owns the canonical note; it
 * renders a doc it's given and reports edits back via onChange. Cross-surface live sync is done by
 * subscribing to the shared store and re-applying the doc when THIS editor isn't focused.
 *
 * Storage is ProseMirror/Tiptap JSON (`doc`) plus a derived plain-text (structuredNotesToPlainText)
 * for AI/search. The slash menu renders into the editor's OWN document, so it works inside the
 * Document PiP window (not invisibly in the main document).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EditorContent, ReactNodeViewRenderer, useEditor, type Editor } from '@tiptap/react'
import { Extension, InputRule } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Quote, Minus, Table as TableIcon, Code, Type, Image as ImageIcon, Film, Music, Paperclip, BarChart3, PanelsTopLeft, Info, Link2, CalendarDays } from 'lucide-react'
import { structuredNotesToPlainText, EMPTY_DOC, type NotesDoc } from '@/data/active-session/notes-doc'
import { CodeBlockView, CodeBlockChromeContext } from './code-block-view'
import { TableControls } from './table-controls'
import { EditorSurfaceContext, type EditorUploadTarget } from './blocks/editor-surface'
import { NoteLink, insertNoteLink } from './blocks/note-link'
import { ChartBlock, insertChart } from './blocks/chart-block'
import { ImageBlock, VideoBlock, AudioBlock, FileBlock, insertMedia, stashPendingFile } from './blocks/media-blocks'
import type { EditorView, EditorProps } from '@tiptap/pm/view'
import { PluginKey } from '@tiptap/pm/state'
import { TabsBlock, Tab, insertTabs } from './blocks/tabs-block'
import { CalloutBlock, insertCallout } from './blocks/callout-block'
import { DateBlock, insertDate } from './blocks/date-block'
import { BlockControls } from './blocks/block-controls'
import { BlockSelectionHighlight } from './blocks/block-selection-decoration'
import { SLASH_PREVIEWS } from './blocks/slash-previews'
import { cn } from '@/lib/utils'

/** Editor knobs driven by Notes preferences. Defaults preserve the original behavior everywhere the
 *  caller doesn't pass options (dock / PiP / anywhere without the settings context). */
export interface NotesEditorOptions {
  slashCommands: boolean
  markdownShortcuts: boolean
  spellcheck: boolean
  showCodeLanguageSelector: boolean
  showCopyButton: boolean
  defaultTableSize: number
  codeTheme: 'system' | 'dark' | 'light'
  textSize: 'small' | 'default' | 'large'
  lineHeight: 'compact' | 'comfortable' | 'relaxed'
}
export const DEFAULT_NOTES_EDITOR_OPTIONS: NotesEditorOptions = {
  slashCommands: true,
  markdownShortcuts: true,
  spellcheck: true,
  showCodeLanguageSelector: true,
  showCopyButton: true,
  defaultTableSize: 3,
  codeTheme: 'system',
  textSize: 'default',
  lineHeight: 'comfortable',
}

// TaskList with a Markdown input rule (Tiptap ships none): `[] `, `[ ] `, or `[x] ` at the start of a
// line converts it to a to-do item (checked when `x`). Gated by enableInputRules like every other rule.
const TaskListMarkdown = TaskList.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /^\[( |x)?\]\s$/,
        handler: ({ range, match, chain }) => {
          const checked = match[1] === 'x'
          chain().deleteRange(range).toggleTaskList().run()
          if (checked) chain().updateAttributes('taskItem', { checked: true }).run()
        },
      }),
    ]
  },
})

// One lowlight instance (highlight.js `common` bundle: JS/TS/JSON/HTML/CSS/Python/Java/C/C++/C#/Bash/SQL/Markdown…).
const lowlight = createLowlight(common)
const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView)
  },
}).configure({ lowlight, defaultLanguage: 'plaintext' })

// Keep the caret this far above the scroll container's bottom edge when typing near it, so the
// active line never sits behind the RecordingDock (full surfaces get a lower-middle resting line).
const SCROLL_MARGIN_FULL = 260
const SCROLL_MARGIN_COMPACT = 48

interface SlashItem {
  title: string
  group: string
  keywords: string
  icon: React.ReactNode
  /** Quick Markdown syntax shown (secondary) beside the item — teaches "you can type this directly". */
  shortcut?: string
  run: (editor: Editor, range: { from: number; to: number }) => void
}

/** Ordered group headers for the slash menu — items render grouped in this order. */
const SLASH_GROUP_ORDER = ['Basic', 'Lists', 'Insert', 'Media', 'Data', 'Link'] as const

// Our own key for the slash Suggestion plugin so we can read its live state (active/query/range).
// This suggestion version fires a spurious onExit right after onStart (its built-in floating-ui
// dismiss), so onExit must verify the plugin is REALLY inactive before closing the menu.
const slashPluginKey = new PluginKey('slashCommand')

function buildSlashItems(tableSize: number): SlashItem[] {
  return [
    // BASIC
    { title: 'Text', group: 'Basic', keywords: 'text paragraph body', icon: <Type />, run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
    { title: 'Heading 1', group: 'Basic', keywords: 'heading title h1 large', icon: <Heading1 />, shortcut: '#', run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 1 }).run() },
    { title: 'Heading 2', group: 'Basic', keywords: 'heading h2 subtitle', icon: <Heading2 />, shortcut: '##', run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run() },
    { title: 'Heading 3', group: 'Basic', keywords: 'heading h3', icon: <Heading3 />, shortcut: '###', run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run() },
    // LISTS
    { title: 'Bullet list', group: 'Lists', keywords: 'bullet unordered list ul', icon: <List />, shortcut: '-', run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
    { title: 'Numbered list', group: 'Lists', keywords: 'numbered ordered list ol', icon: <ListOrdered />, shortcut: '1.', run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
    { title: 'To-do list', group: 'Lists', keywords: 'todo task checkbox check', icon: <ListTodo />, shortcut: '[]', run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
    // INSERT
    { title: 'Table', group: 'Insert', keywords: 'table grid', icon: <TableIcon />, run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: tableSize, cols: tableSize, withHeaderRow: true }).run() },
    { title: 'Tabs', group: 'Insert', keywords: 'tabs tabbed sections panels', icon: <PanelsTopLeft />, run: (e, r) => insertTabs(e, r) },
    { title: 'Divider', group: 'Insert', keywords: 'divider horizontal rule hr line', icon: <Minus />, shortcut: '---', run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
    { title: 'Quote', group: 'Insert', keywords: 'quote blockquote', icon: <Quote />, shortcut: '>', run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
    { title: 'Callout', group: 'Insert', keywords: 'callout note info highlight aside', icon: <Info />, run: (e, r) => insertCallout(e, r) },
    { title: 'Date', group: 'Insert', keywords: 'date calendar today tomorrow day time', icon: <CalendarDays />, shortcut: '@today', run: (e, r) => insertDate(e, r) },
    // MEDIA
    { title: 'Image', group: 'Media', keywords: 'image picture photo upload', icon: <ImageIcon />, run: (e, r) => insertMedia('image', e, r) },
    { title: 'Video', group: 'Media', keywords: 'video movie mp4 embed', icon: <Film />, run: (e, r) => insertMedia('video', e, r) },
    { title: 'Audio', group: 'Media', keywords: 'audio sound voice recording', icon: <Music />, run: (e, r) => insertMedia('audio', e, r) },
    { title: 'File', group: 'Media', keywords: 'file attachment document upload', icon: <Paperclip />, run: (e, r) => insertMedia('file', e, r) },
    // DATA
    { title: 'Chart', group: 'Data', keywords: 'chart graph bar line pie data', icon: <BarChart3 />, run: (e, r) => insertChart(e, r) },
    { title: 'Code', group: 'Data', keywords: 'code monospace snippet', icon: <Code />, shortcut: '```', run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
    // LINK
    { title: 'Link to note', group: 'Link', keywords: 'link note page reference mention internal', icon: <Link2 />, run: (e, r) => insertNoteLink(e, r) },
  ]
}

interface MenuState {
  items: SlashItem[]
  /** The editor + trigger range; the menu derives its screen position from these live (via
   *  coordsAtPos) instead of a rect captured at trigger time — that rect is null during fast typing
   *  because the suggestion decoration isn't laid out yet, which silently suppressed the menu. */
  editor: Editor
  range: { from: number; to: number }
  ownerDoc: Document
}

/** Image files from a paste/drop payload. */
function imageFiles(list: FileList | null | undefined): File[] {
  return list ? Array.from(list).filter((f) => f.type.startsWith('image/')) : []
}

/** Inserts empty image blocks (each holding a stashed File) at `at`; their NodeViews upload on mount. */
function insertImageFiles(view: EditorView, files: File[], at: number) {
  const type = view.state.schema.nodes.image
  if (!type) return
  let tr = view.state.tr
  let pos = at
  for (const file of files) {
    const node = type.create({ status: 'empty', pendingId: stashPendingFile(file) })
    tr = tr.insert(pos, node)
    pos += node.nodeSize
  }
  view.dispatch(tr)
}

export interface RichNotesEditorProps {
  initialDoc: NotesDoc
  onChange: (doc: NotesDoc, plainText: string) => void
  /** Optional live-sync source; when it fires and THIS editor isn't focused, re-apply the doc. */
  subscribe?: (cb: () => void) => () => void
  getDoc?: () => NotesDoc
  editable?: boolean
  compact?: boolean
  autofocus?: boolean
  placeholder?: string
  onBlur?: () => void
  /** Cmd/Ctrl+Enter while editing → mark the current moment (session-level, not an editor command). */
  onMarkMoment?: () => void
  /** Notes-preference-driven editor knobs. Omitted → DEFAULT_NOTES_EDITOR_OPTIONS (original behavior). */
  options?: Partial<NotesEditorOptions>
  /** Where media uploads go (workspace/author/note). Omitted → media blocks render read-only/disabled. */
  uploadTarget?: EditorUploadTarget
  /** "Open full note" destination for advanced blocks on compact surfaces (dock / PiP). */
  openFullHref?: string
  className?: string
}

export function RichNotesEditor({
  initialDoc,
  onChange,
  subscribe,
  getDoc,
  editable = true,
  compact = false,
  autofocus = false,
  placeholder = 'Write anything you want Recall to remember…',
  onBlur,
  onMarkMoment,
  options,
  uploadTarget,
  openFullHref,
  className,
}: RichNotesEditorProps) {
  const opts = { ...DEFAULT_NOTES_EDITOR_OPTIONS, ...options }
  const uploadRef = useRef(uploadTarget)
  uploadRef.current = uploadTarget
  const markRef = useRef(onMarkMoment)
  markRef.current = onMarkMoment
  const slashItemsRef = useRef<SlashItem[]>(buildSlashItems(opts.defaultTableSize))
  slashItemsRef.current = buildSlashItems(opts.defaultTableSize)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)
  selectedRef.current = selected
  const menuRef = useRef<MenuState | null>(null)
  menuRef.current = menu

  // Slash-command extension. Its Suggestion popup is driven into React state below and portaled into
  // the editor's OWN document (so it appears inside the PiP window, not the main one).
  const slash = useMemo(
    () =>
      Extension.create({
        name: 'slashCommand',
        addProseMirrorPlugins() {
          return [
            Suggestion<SlashItem>({
              editor: this.editor,
              pluginKey: slashPluginKey,
              char: '/',
              startOfLine: false,
              // Trigger after ANY character (default only fires after a space / line start), so `/`
              // opens the menu even right after a word — matches Notion, fixes "sometimes / does nothing".
              allowedPrefixes: null,
              command: ({ editor, range, props }) => props.run(editor, range),
              items: ({ query }) => {
                const q = query.toLowerCase()
                return slashItemsRef.current.filter((i) => i.title.toLowerCase().includes(q) || i.keywords.includes(q))
              },
              render: () => {
                const sync = (props: {
                  query?: string
                  editor: Editor
                  range: { from: number; to: number }
                }) => {
                  // Recompute items from the query ourselves. This suggestion version calls onStart with
                  // an EMPTY items array (items resolve async), so trusting props.items would hide the
                  // menu on the very keystroke that opens it — the "/" sometimes does nothing bug.
                  const q = (props.query ?? '').toLowerCase()
                  const items = slashItemsRef.current.filter((i) => i.title.toLowerCase().includes(q) || i.keywords.includes(q))
                  const ownerDoc = props.editor.view.dom.ownerDocument
                  setSelected(0)
                  setMenu(items.length ? { items, editor: props.editor, range: props.range, ownerDoc } : null)
                }
                return {
                  onStart: sync,
                  onUpdate: sync,
                  onKeyDown: ({ event }) => {
                    const m = menuRef.current
                    if (!m) return false
                    if (event.key === 'ArrowDown') {
                      setSelected((s) => (s + 1) % m.items.length)
                      return true
                    }
                    if (event.key === 'ArrowUp') {
                      setSelected((s) => (s - 1 + m.items.length) % m.items.length)
                      return true
                    }
                    if (event.key === 'Enter') {
                      m.items[selectedRef.current]?.run(this.editor, m.range)
                      setMenu(null)
                      return true
                    }
                    if (event.key === 'Escape') {
                      setMenu(null)
                      return true
                    }
                    return false
                  },
                  // Only close when the suggestion is TRULY inactive. This version emits a spurious exit
                  // immediately after start (built-in floating-ui dismiss); at that instant the plugin is
                  // still active, so we ignore it and keep the menu open.
                  onExit: () => {
                    if (slashPluginKey.getState(this.editor.state)?.active) return
                    setMenu(null)
                  },
                }
              },
            }),
          ]
        },
      }),
    [],
  )

  // Stable extensions + editorProps. Tiptap's useEditor calls editor.setOptions() on EVERY render
  // where these differ by reference (its compareOptions), and that resets ProseMirror state — which
  // silently kills an in-progress slash menu. Memoizing them means the frequent unrelated re-renders
  // (the debounced "Saving…" status ticking on each keystroke) no longer rebuild the editor, so `/`
  // works reliably even while saving.
  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false, dropcursor: { color: 'var(--color-accent)', width: 2 } }),
      CodeBlock,
      TaskListMarkdown,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      // Advanced blocks (persist as JSON; NodeViews read EditorSurfaceContext for compact/upload).
      NoteLink,
      ChartBlock,
      CalloutBlock,
      ImageBlock,
      VideoBlock,
      AudioBlock,
      FileBlock,
      TabsBlock,
      Tab,
      DateBlock,
      BlockSelectionHighlight,
      Placeholder.configure({ placeholder }),
      ...(opts.slashCommands ? [slash] : []),
    ],
    [slash, placeholder, opts.slashCommands],
  )

  const editorProps = useMemo<EditorProps>(
    () => ({
      scrollThreshold: { top: 80, bottom: compact ? SCROLL_MARGIN_COMPACT : SCROLL_MARGIN_FULL, left: 0, right: 0 },
      scrollMargin: { top: 80, bottom: compact ? SCROLL_MARGIN_COMPACT : SCROLL_MARGIN_FULL, left: 0, right: 0 },
      attributes: {
        spellcheck: String(opts.spellcheck),
        class: cn(
          'recall-notes-prose focus:outline-none',
          compact ? 'recall-notes-prose--compact' : '',
          `recall-notes-text-${opts.textSize}`,
          `recall-notes-lh-${opts.lineHeight}`,
          opts.codeTheme !== 'system' ? `recall-notes-code-${opts.codeTheme}` : '',
        ),
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && markRef.current) {
          event.preventDefault()
          markRef.current()
          return true
        }
        return false
      },
      // Paste / drop images → upload as image blocks (only when a Storage target exists). Any other
      // content falls through to default handling.
      handlePaste: (view, event) => {
        if (!uploadRef.current) return false
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length) return false
        event.preventDefault()
        insertImageFiles(view, files, view.state.selection.from)
        return true
      },
      handleDrop: (view, event) => {
        if (!uploadRef.current) return false
        const files = imageFiles((event as DragEvent).dataTransfer?.files)
        if (!files.length) return false
        event.preventDefault()
        const at = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY })?.pos ?? view.state.selection.from
        insertImageFiles(view, files, at)
        return true
      },
    }),
    [compact, opts.spellcheck, opts.textSize, opts.lineHeight, opts.codeTheme],
  )

  const editor = useEditor({
    editable,
    immediatelyRender: false, // required under Next / client-only rendering
    autofocus: autofocus ? 'end' : false,
    enableInputRules: opts.markdownShortcuts, // Markdown shortcuts (##, -, ```lang, [] …)
    enablePasteRules: opts.markdownShortcuts,
    extensions,
    content: initialDoc ?? EMPTY_DOC,
    editorProps,
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as NotesDoc
      onChange(doc, structuredNotesToPlainText(doc))
    },
    onBlur: () => onBlur?.(),
  })

  // Apply display prefs live (text size / line height / code theme / spellcheck) by patching the
  // ProseMirror DOM directly, so a settings change reflects without remounting the editor.
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    dom.classList.remove(
      'recall-notes-text-small', 'recall-notes-text-default', 'recall-notes-text-large',
      'recall-notes-lh-compact', 'recall-notes-lh-comfortable', 'recall-notes-lh-relaxed',
      'recall-notes-code-dark', 'recall-notes-code-light',
    )
    dom.classList.add(`recall-notes-text-${opts.textSize}`, `recall-notes-lh-${opts.lineHeight}`)
    if (opts.codeTheme !== 'system') dom.classList.add(`recall-notes-code-${opts.codeTheme}`)
    dom.setAttribute('spellcheck', String(opts.spellcheck))
  }, [editor, opts.textSize, opts.lineHeight, opts.codeTheme, opts.spellcheck])

  // Live sync from the shared store: when another surface edits, re-apply here if we're not typing.
  useEffect(() => {
    if (!editor || !subscribe || !getDoc) return
    return subscribe(() => {
      if (editor.isFocused) return
      const incoming = getDoc()
      if (JSON.stringify(incoming) !== JSON.stringify(editor.getJSON())) {
        editor.commands.setContent(incoming, { emitUpdate: false })
      }
    })
  }, [editor, subscribe, getDoc])

  return (
    <CodeBlockChromeContext.Provider value={{ showLanguageSelector: opts.showCodeLanguageSelector, showCopyButton: opts.showCopyButton }}>
    <EditorSurfaceContext.Provider value={{ compact, upload: uploadTarget, openFullHref }}>
    <div className={className}>
      <EditorContent editor={editor} />
      {/* Left-gutter block chrome (drag handle + insert + block menu) — full surfaces only. */}
      {editor && !compact && editable && <BlockControls editor={editor} />}
      {/* Contextual table editing — hidden on compact surfaces (dock/PiP); content still renders. */}
      {editor && !compact && <TableControls editor={editor} />}
      {menu
        ? createPortal(
            <SlashMenu
              menu={menu}
              selected={selected}
              onHover={setSelected}
              onChoose={(item) => {
                if (editor) item.run(editor, menu.range)
                setMenu(null)
              }}
            />,
            menu.ownerDoc.body,
          )
        : null}
    </div>
    </EditorSurfaceContext.Provider>
    </CodeBlockChromeContext.Provider>
  )
}

/**
 * The `/` block menu. Groups items by their section (headers appear when the group changes), caps its
 * height and scrolls internally, keeps the selected row scrolled into view during arrow navigation, and
 * positions itself viewport-aware: below the caret by default, flipped above when there's more room,
 * always clamped inside the viewport with a small margin.
 */
function SlashMenu({
  menu,
  selected,
  onHover,
  onChoose,
}: {
  menu: MenuState
  selected: number
  onHover: (i: number) => void
  onChoose: (item: SlashItem) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const win = menu.ownerDoc.defaultView ?? window
  const MARGIN = 8
  const PREVIEW_W = 184
  const maxHeight = Math.min(440, win.innerHeight - MARGIN * 2)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  // Small floating preview card, positioned beside the menu near the selected row (Notion-style).
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number } | null>(null)

  // Position after measuring the (height-capped) menu. The caret anchor is derived LIVE from the
  // editor + trigger position (coordsAtPos), which is reliable even mid-fast-typing — unlike a rect
  // captured when the suggestion fired (that's null before the decoration lays out).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let rect: { left: number; top: number; bottom: number }
    try {
      const c = menu.editor.view.coordsAtPos(menu.range.from)
      rect = { left: c.left, top: c.top, bottom: c.bottom }
    } catch {
      return
    }
    const menuH = el.offsetHeight
    const menuW = el.offsetWidth
    const spaceBelow = win.innerHeight - rect.bottom - MARGIN
    const spaceAbove = rect.top - MARGIN
    const placeAbove = spaceBelow < menuH && spaceAbove > spaceBelow
    let top = placeAbove ? rect.top - menuH - 6 : rect.bottom + 6
    top = Math.max(MARGIN, Math.min(top, win.innerHeight - menuH - MARGIN))
    let left = Math.min(rect.left, win.innerWidth - menuW - MARGIN)
    left = Math.max(MARGIN, left)
    setCoords({ top, left })
  }, [menu.editor, menu.range.from, menu.items.length, win])

  // Keep the keyboard-selected row visible, and anchor the preview card next to it.
  useLayoutEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-slash-index="${selected}"]`)
    row?.scrollIntoView({ block: 'nearest' })
    const box = ref.current
    if (!row || !box) return
    const boxRect = box.getBoundingClientRect()
    const rowRect = row.getBoundingClientRect()
    // Prefer the right side; flip left when it would overflow the viewport.
    let left = boxRect.right + 8
    if (left + PREVIEW_W > win.innerWidth - MARGIN) left = boxRect.left - PREVIEW_W - 8
    const top = Math.max(MARGIN, Math.min(rowRect.top - 2, win.innerHeight - 120 - MARGIN))
    setPreviewPos({ top, left })
  }, [selected, coords, win])

  let prevGroup = ''
  const preview = SLASH_PREVIEWS[menu.items[selected]?.title ?? '']
  return (
    <>
      <div
        ref={ref}
        role="listbox"
        aria-label="Insert block"
        className="z-[60] w-60 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
        style={{ position: 'fixed', top: coords?.top ?? -9999, left: coords?.left ?? -9999, maxHeight, visibility: coords ? 'visible' : 'hidden' }}
      >
        <div ref={listRef} className="recall-slash-scroll overflow-y-auto p-1" style={{ maxHeight }}>
          {menu.items.map((item, i) => {
            const header = item.group !== prevGroup ? item.group : null
            prevGroup = item.group
            return (
              <div key={item.title}>
                {header && <div className="px-2 pb-1 pt-2 text-caption font-medium uppercase tracking-wide text-subtle-foreground first:pt-1">{header}</div>}
                <button
                  type="button"
                  role="option"
                  data-slash-index={i}
                  aria-selected={i === selected}
                  onMouseEnter={() => onHover(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChoose(item)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-small transition-fast',
                    i === selected ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:bg-surface-hover',
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border-subtle text-subtle-foreground [&>svg]:size-3.5">{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  {item.shortcut && <span className="shrink-0 font-mono text-caption text-subtle-foreground">{item.shortcut}</span>}
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {preview && coords && previewPos && (
        <div
          className="z-[60] hidden overflow-hidden rounded-lg border border-border bg-surface-raised p-2 shadow-lg sm:block"
          style={{ position: 'fixed', top: previewPos.top, left: previewPos.left, width: PREVIEW_W }}
        >
          <div className="flex min-h-[64px] items-center rounded-md border border-border-subtle bg-surface px-3 py-2.5">
            <div className="w-full text-small text-foreground">{preview.node}</div>
          </div>
          <div className="px-0.5 pt-1.5 text-caption text-subtle-foreground">{preview.caption}</div>
        </div>
      )}
    </>
  )
}
