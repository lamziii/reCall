import { describe, expect, it } from 'vitest'
import {
  countByFilter,
  displayTitle,
  filterNotes,
  itemsInFolder,
  meetingNoteToItem,
  noteBelongsTo,
  notePreview,
  personalNoteToItem,
  searchNotes,
  sortNotes,
  type NoteListItem,
  type PersonalNoteDoc,
} from './note-model'

const basePersonal: PersonalNoteDoc = {
  id: 'n1',
  workspace_id: 'ws1',
  author_id: 'u1',
  title: 'Launch plan',
  source: 'personal',
  session_id: null,
  folder_id: 'f-work',
  favorite: true,
  visibility: 'private',
  content: 'Ship pricing page\nfinalize copy',
  doc: { type: 'doc', content: [] },
  format: 'tiptap',
  created_at_ms: 1000,
  updated_at_ms: 5000,
}

function item(partial: Partial<NoteListItem>): NoteListItem {
  return { id: 'x', source: 'personal', title: 'T', plainText: '', folderId: null, favorite: false, createdAtMs: 0, updatedAtMs: 0, ...partial }
}

describe('displayTitle', () => {
  it('falls back to Untitled for empty/whitespace titles', () => {
    expect(displayTitle('')).toBe('Untitled')
    expect(displayTitle('   ')).toBe('Untitled')
    expect(displayTitle('Real')).toBe('Real')
  })
})

describe('personalNoteToItem', () => {
  it('normalizes a personal note doc into a list item', () => {
    const it0 = personalNoteToItem(basePersonal)
    expect(it0).toMatchObject({ id: 'n1', source: 'personal', title: 'Launch plan', folderId: 'f-work', favorite: true, noteId: 'n1' })
    expect(it0.plainText).toContain('pricing')
  })
})

describe('meetingNoteToItem', () => {
  const input = {
    sessionId: 's1',
    sessionTitle: 'Design Sync',
    sessionCreatedAtMs: 2000,
    durationSeconds: 2520,
    note: { content: 'agreed on layout', updated_at_ms: 9000, favorite: false, folder_id: null },
  }
  it('namespaces the id and carries session metadata', () => {
    const it0 = meetingNoteToItem(input)!
    expect(it0.id).toBe('session:s1')
    expect(it0.source).toBe('meeting')
    expect(it0.sessionId).toBe('s1')
    expect(it0.sessionDurationSeconds).toBe(2520)
    expect(it0.updatedAtMs).toBe(9000)
  })
  it('returns null when the note slot has no content (empty meeting note is not shown)', () => {
    expect(meetingNoteToItem({ ...input, note: { content: '   ' } })).toBeNull()
  })
})

describe('filterNotes', () => {
  const items = [
    item({ id: 'a', source: 'personal', favorite: true, folderId: 'f1' }),
    item({ id: 'b', source: 'meeting', favorite: false, folderId: null }),
    item({ id: 'c', source: 'personal', favorite: false, folderId: 'f2' }),
  ]
  it('filters by source, favorites, and folder', () => {
    expect(filterNotes(items, 'all').map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(filterNotes(items, 'personal').map((i) => i.id)).toEqual(['a', 'c'])
    expect(filterNotes(items, 'meetings').map((i) => i.id)).toEqual(['b'])
    expect(filterNotes(items, 'favorites').map((i) => i.id)).toEqual(['a'])
    expect(filterNotes(items, { folderId: 'f2' }).map((i) => i.id)).toEqual(['c'])
  })
})

describe('searchNotes', () => {
  const items = [
    item({ id: 'a', title: 'Pricing', plainText: 'stripe integration' }),
    item({ id: 'b', title: 'Groceries', plainText: 'milk and eggs' }),
  ]
  it('matches title or content, case-insensitively; empty query = all', () => {
    expect(searchNotes(items, 'PRIC').map((i) => i.id)).toEqual(['a'])
    expect(searchNotes(items, 'eggs').map((i) => i.id)).toEqual(['b'])
    expect(searchNotes(items, 'stripe').map((i) => i.id)).toEqual(['a'])
    expect(searchNotes(items, '').map((i) => i.id)).toEqual(['a', 'b'])
  })
})

describe('sortNotes', () => {
  const items = [
    item({ id: 'old', title: 'B', createdAtMs: 1, updatedAtMs: 10 }),
    item({ id: 'new', title: 'A', createdAtMs: 3, updatedAtMs: 5 }),
  ]
  it('sorts by updated (default), newest, oldest, title without mutating input', () => {
    expect(sortNotes(items, 'updated').map((i) => i.id)).toEqual(['old', 'new'])
    expect(sortNotes(items, 'newest').map((i) => i.id)).toEqual(['new', 'old'])
    expect(sortNotes(items, 'oldest').map((i) => i.id)).toEqual(['old', 'new'])
    expect(sortNotes(items, 'title').map((i) => i.id)).toEqual(['new', 'old'])
    expect(items[0].id).toBe('old') // input untouched
  })
})

describe('countByFilter', () => {
  it('counts each top-level bucket', () => {
    const items = [item({ source: 'personal', favorite: true }), item({ source: 'meeting' }), item({ source: 'personal' })]
    expect(countByFilter(items)).toEqual({ all: 3, personal: 2, meetings: 1, favorites: 1 })
  })
})

describe('itemsInFolder (folder-deletion safety)', () => {
  it('identifies exactly the notes that must be uncategorized — never signals deleting them', () => {
    const items = [item({ id: 'a', folderId: 'f1' }), item({ id: 'b', folderId: 'f2' }), item({ id: 'c', folderId: 'f1' })]
    expect(itemsInFolder(items, 'f1').map((i) => i.id)).toEqual(['a', 'c'])
    expect(itemsInFolder(items, 'none')).toEqual([])
  })
})

describe('noteBelongsTo (scoping guard)', () => {
  it('matches only same workspace AND author', () => {
    const n = { workspace_id: 'ws1', author_id: 'u1' }
    expect(noteBelongsTo(n, 'ws1', 'u1')).toBe(true)
    expect(noteBelongsTo(n, 'ws2', 'u1')).toBe(false)
    expect(noteBelongsTo(n, 'ws1', 'u2')).toBe(false)
  })
})

describe('notePreview', () => {
  it('uses the first non-empty line and truncates', () => {
    expect(notePreview('\n\nhello world\nsecond')).toBe('hello world')
    expect(notePreview('x'.repeat(200)).endsWith('…')).toBe(true)
  })
})
