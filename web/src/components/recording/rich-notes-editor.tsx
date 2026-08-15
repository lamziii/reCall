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
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EditorContent, ReactNodeViewRenderer, useEditor, type Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
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
import { Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Quote, Minus, Table as TableIcon, Code, Type } from 'lucide-react'
import { structuredNotesToPlainText, EMPTY_DOC, type NotesDoc } from '@/data/active-session/notes-doc'
import { CodeBlockView, CodeBlockChromeContext } from './code-block-view'
import { TableControls } from './table-controls'
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
  keywords: string
  icon: React.ReactNode
  run: (editor: Editor, range: { from: number; to: number }) => void
}

function buildSlashItems(tableSize: number): SlashItem[] {
  return [
    { title: 'Text', keywords: 'text paragraph body', icon: <Type />, run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
    { title: 'Heading 1', keywords: 'heading title h1 large', icon: <Heading1 />, run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 1 }).run() },
    { title: 'Heading 2', keywords: 'heading h2 subtitle', icon: <Heading2 />, run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run() },
    { title: 'Heading 3', keywords: 'heading h3', icon: <Heading3 />, run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run() },
    { title: 'Bullet list', keywords: 'bullet unordered list ul', icon: <List />, run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
    { title: 'Numbered list', keywords: 'numbered ordered list ol', icon: <ListOrdered />, run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
    { title: 'To-do list', keywords: 'todo task checkbox check', icon: <ListTodo />, run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
    { title: 'Quote', keywords: 'quote blockquote', icon: <Quote />, run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
    { title: 'Divider', keywords: 'divider horizontal rule hr line', icon: <Minus />, run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
    { title: 'Table', keywords: 'table grid', icon: <TableIcon />, run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: tableSize, cols: tableSize, withHeaderRow: true }).run() },
    { title: 'Code block', keywords: 'code monospace snippet', icon: <Code />, run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  ]
}

interface MenuState {
  items: SlashItem[]
  rect: DOMRect | null
  range: { from: number; to: number }
  ownerDoc: Document
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
  className,
}: RichNotesEditorProps) {
  const opts = { ...DEFAULT_NOTES_EDITOR_OPTIONS, ...options }
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
              char: '/',
              startOfLine: false,
              command: ({ editor, range, props }) => props.run(editor, range),
              items: ({ query }) => {
                const q = query.toLowerCase()
                return slashItemsRef.current.filter((i) => i.title.toLowerCase().includes(q) || i.keywords.includes(q))
              },
              render: () => {
                const sync = (props: {
                  items: SlashItem[]
                  clientRect?: (() => DOMRect | null) | null
                  editor: Editor
                  range: { from: number; to: number }
                }) => {
                  const ownerDoc = props.editor.view.dom.ownerDocument
                  setSelected(0)
                  setMenu(props.items.length ? { items: props.items, rect: props.clientRect?.() ?? null, range: props.range, ownerDoc } : null)
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
                  onExit: () => setMenu(null),
                }
              },
            }),
          ]
        },
      }),
    [],
  )

  const editor = useEditor({
    editable,
    immediatelyRender: false, // required under Next / client-only rendering
    autofocus: autofocus ? 'end' : false,
    enableInputRules: opts.markdownShortcuts, // Markdown shortcuts (##, -, ```lang, [] …)
    enablePasteRules: opts.markdownShortcuts,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      CodeBlock,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      ...(opts.slashCommands ? [slash] : []),
    ],
    content: initialDoc ?? EMPTY_DOC,
    editorProps: {
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
    },
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

  const activeItem = menu?.items[selected]

  return (
    <CodeBlockChromeContext.Provider value={{ showLanguageSelector: opts.showCodeLanguageSelector, showCopyButton: opts.showCopyButton }}>
    <div className={className}>
      <EditorContent editor={editor} />
      {/* Contextual table editing — hidden on compact surfaces (dock/PiP); content still renders. */}
      {editor && !compact && <TableControls editor={editor} />}
      {menu && menu.rect
        ? createPortal(
            <div
              role="listbox"
              aria-label="Insert block"
              className="z-[60] w-56 overflow-hidden rounded-lg border border-border bg-surface-raised p-1 shadow-lg"
              style={{ position: 'fixed', top: menu.rect.bottom + 6, left: menu.rect.left }}
            >
              <div className="px-2 pb-1 pt-1.5 text-caption uppercase tracking-wide text-subtle-foreground">Basic blocks</div>
              {menu.items.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  role="option"
                  aria-selected={activeItem?.title === item.title}
                  onMouseEnter={() => setSelected(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (editor) item.run(editor, menu.range)
                    setMenu(null)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-small transition-fast',
                    i === selected ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:bg-surface-hover',
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border-subtle text-subtle-foreground [&>svg]:size-3.5">
                    {item.icon}
                  </span>
                  {item.title}
                </button>
              ))}
            </div>,
            menu.ownerDoc.body,
          )
        : null}
    </div>
    </CodeBlockChromeContext.Provider>
  )
}
