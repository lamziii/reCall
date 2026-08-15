/**
 * Canonical structured-notes model + conversions. Pure (no Tiptap import) so it's trivially testable
 * and usable server-side later.
 *
 * Storage shape (user_notes[authorId]): `{ content: <plain text>, doc: <ProseMirror/Tiptap JSON>,
 * format: 'tiptap', marks, ... }`. We keep `content` = plain text so old readers, search, and the AI
 * layer get clean text with zero editor knowledge; `doc` holds the structure. On read, a note without
 * `doc` is a legacy plain-text note → normalized via plainTextToDoc (migration-on-read).
 */

export interface PMNode {
  type: string
  attrs?: Record<string, unknown>
  content?: PMNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}
export interface NotesDoc {
  type: 'doc'
  content: PMNode[]
}

export const EMPTY_DOC: NotesDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

export function isNotesDoc(v: unknown): v is NotesDoc {
  return Boolean(v) && typeof v === 'object' && (v as PMNode).type === 'doc' && Array.isArray((v as NotesDoc).content)
}

export function docIsEmpty(doc: NotesDoc | null | undefined): boolean {
  if (!doc || !doc.content?.length) return true
  return doc.content.every((n) => n.type === 'paragraph' && !inlineText(n).trim())
}

/** Legacy plain text → a valid editor document. Each line becomes a paragraph (blank line = empty para). */
export function plainTextToDoc(text: string | null | undefined): NotesDoc {
  const raw = text ?? ''
  if (!raw) return { type: 'doc', content: [{ type: 'paragraph' }] }
  const content: PMNode[] = raw.split('\n').map((line) =>
    line.length ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' },
  )
  return { type: 'doc', content }
}

/** Best-effort: use `doc` if present/valid, else migrate the legacy plain-text `content`. */
export function toNotesDoc(input: { doc?: unknown; content?: string | null } | null | undefined): NotesDoc {
  if (input && isNotesDoc(input.doc)) return input.doc
  return plainTextToDoc(input?.content ?? '')
}

// ---- plain-text extraction (for AI / search) -----------------------------------------------------

function inlineText(node: PMNode | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (node.content) return node.content.map(inlineText).join('')
  return ''
}

/**
 * structuredNotesToPlainText — converts editor JSON into clean, readable, AI-friendly text. Uses light
 * markdown-ish conventions so hierarchy/lists/todos/tables survive as text (never thrown away).
 */
export function structuredNotesToPlainText(doc: NotesDoc | null | undefined): string {
  if (!doc || !Array.isArray(doc.content)) return ''
  return doc.content.map((n) => serializeBlock(n)).filter((s) => s !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function serializeBlock(node: PMNode, depth = 0): string {
  const pad = '  '.repeat(depth)
  switch (node.type) {
    case 'paragraph':
      return pad + inlineText(node)
    case 'heading': {
      const level = Number(node.attrs?.level ?? 1)
      return `${pad}${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${inlineText(node)}`
    }
    case 'bulletList':
      return (node.content ?? []).map((li) => serializeListItem(li, depth, '-')).join('\n')
    case 'orderedList': {
      let i = Number(node.attrs?.start ?? 1)
      return (node.content ?? []).map((li) => serializeListItem(li, depth, `${i++}.`)).join('\n')
    }
    case 'taskList':
      return (node.content ?? []).map((li) => serializeTaskItem(li, depth)).join('\n')
    case 'blockquote':
      return (node.content ?? []).map((c) => `${pad}> ${inlineText(c)}`).join('\n')
    case 'codeBlock':
      return `${pad}\`\`\`\n${inlineText(node)}\n${pad}\`\`\``
    case 'horizontalRule':
      return `${pad}---`
    case 'table':
      return serializeTable(node, pad)
    default:
      return pad + inlineText(node)
  }
}

function serializeListItem(li: PMNode, depth: number, marker: string): string {
  const pad = '  '.repeat(depth)
  const blocks = li.content ?? []
  const first = blocks[0]
  const head = `${pad}${marker} ${inlineText(first)}`
  const nested = blocks.slice(1).map((b) => serializeBlock(b, depth + 1)).filter(Boolean)
  return [head, ...nested].join('\n')
}

function serializeTaskItem(li: PMNode, depth: number): string {
  const pad = '  '.repeat(depth)
  const checked = li.attrs?.checked === true
  const blocks = li.content ?? []
  const head = `${pad}[${checked ? 'x' : ' '}] ${inlineText(blocks[0])}`
  const nested = blocks.slice(1).map((b) => serializeBlock(b, depth + 1)).filter(Boolean)
  return [head, ...nested].join('\n')
}

function serializeTable(node: PMNode, pad: string): string {
  const rows = (node.content ?? []).map((row) => {
    const cells = (row.content ?? []).map((cell) => inlineText(cell).trim())
    return `${pad}${cells.join(' | ')}`
  })
  return rows.join('\n')
}
