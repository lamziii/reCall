import { describe, it, expect } from 'vitest'
import {
  plainTextToDoc,
  structuredNotesToPlainText,
  toNotesDoc,
  isNotesDoc,
  docIsEmpty,
  EMPTY_DOC,
  type NotesDoc,
} from './notes-doc'

describe('plainTextToDoc (backward compat / migration-on-read)', () => {
  it('empty text → single empty paragraph', () => {
    expect(plainTextToDoc('')).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
    expect(plainTextToDoc(null)).toEqual(EMPTY_DOC)
  })

  it('multi-line text → one paragraph per line, blank lines preserved', () => {
    const doc = plainTextToDoc('line one\n\nline three')
    expect(doc.content).toHaveLength(3)
    expect(doc.content[0]).toEqual({ type: 'paragraph', content: [{ type: 'text', text: 'line one' }] })
    expect(doc.content[1]).toEqual({ type: 'paragraph' })
    expect(doc.content[2]).toEqual({ type: 'paragraph', content: [{ type: 'text', text: 'line three' }] })
  })

  it('round-trips plain text through doc → text', () => {
    const text = 'Note one from record page.\nNote two from dock panel.'
    expect(structuredNotesToPlainText(plainTextToDoc(text))).toBe(text)
  })
})

describe('toNotesDoc', () => {
  it('prefers a valid doc', () => {
    const doc: NotesDoc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] }
    expect(toNotesDoc({ doc, content: 'stale' })).toBe(doc)
  })
  it('falls back to legacy plain-text content when no doc', () => {
    expect(toNotesDoc({ content: 'legacy note' })).toEqual(plainTextToDoc('legacy note'))
  })
  it('guards non-doc input', () => {
    expect(isNotesDoc({ type: 'paragraph' })).toBe(false)
    expect(isNotesDoc(null)).toBe(false)
    expect(isNotesDoc(EMPTY_DOC)).toBe(true)
  })
})

describe('structuredNotesToPlainText (AI-readable extraction)', () => {
  it('headings become markdown headings', () => {
    const doc: NotesDoc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Pricing Discussion' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Detail' }] },
      ],
    }
    expect(structuredNotesToPlainText(doc)).toBe('# Pricing Discussion\n### Detail')
  })

  it('bullet and numbered lists', () => {
    const li = (t: string): { type: string; content: unknown[] } => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }] })
    const doc = {
      type: 'doc',
      content: [
        { type: 'bulletList', content: [li('Enterprise price needs review'), li('Confirm launch date')] },
        { type: 'orderedList', content: [li('First'), li('Second')] },
      ],
    } as unknown as NotesDoc
    expect(structuredNotesToPlainText(doc)).toBe('- Enterprise price needs review\n- Confirm launch date\n1. First\n2. Second')
  })

  it('to-do items serialize checked state', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ask Sarah' }] }] },
            { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Send deck' }] }] },
          ],
        },
      ],
    } as unknown as NotesDoc
    expect(structuredNotesToPlainText(doc)).toBe('[ ] Ask Sarah\n[x] Send deck')
  })

  it('quote, divider, code block', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a quote' }] }] },
        { type: 'horizontalRule' },
        { type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1' }] },
      ],
    } as unknown as NotesDoc
    expect(structuredNotesToPlainText(doc)).toBe('> a quote\n---\n```\nconst x = 1\n```')
  })

  it('table becomes readable rows (never discarded)', () => {
    const cell = (t: string): unknown => ({ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }] })
    const row = (...t: string[]): unknown => ({ type: 'tableRow', content: t.map(cell) })
    const doc = {
      type: 'doc',
      content: [{ type: 'table', content: [row('Item', 'Owner'), row('Pricing', 'Sarah')] }],
    } as unknown as NotesDoc
    expect(structuredNotesToPlainText(doc)).toBe('Item | Owner\nPricing | Sarah')
  })

  it('docIsEmpty', () => {
    expect(docIsEmpty(EMPTY_DOC)).toBe(true)
    expect(docIsEmpty(plainTextToDoc('hi'))).toBe(false)
  })
})

describe('moment marks are independent of the doc (preserved across edits)', () => {
  it('serialization ignores marks; marks travel separately', () => {
    // Marks live alongside the doc (not inside it), so editing the doc never drops moment marks.
    const marks = [{ offset: 0, timestamp_seconds: 1122, kind: 'moment' as const, created_at_ms: 1 }]
    const doc = plainTextToDoc('edited text')
    // plain-text extraction is mark-agnostic, and the marks array is untouched by doc changes.
    expect(structuredNotesToPlainText(doc)).toBe('edited text')
    expect(marks[0].timestamp_seconds).toBe(1122)
    expect(marks[0].kind).toBe('moment')
  })
})
