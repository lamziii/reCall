import { describe, expect, it } from 'vitest'
import {
  activeItems,
  buildFolderTree,
  countByFilter,
  displayTitle,
  filterNotes,
  folderDescendantIds,
  itemsInFolder,
  meetingNoteToItem,
  nextSortOrder,
  noteBelongsTo,
  notePreview,
  notesInFolder,
  personalNoteToItem,
  reorderIds,
  searchNotes,
  sortByOrder,
  sortNotes,
  trashedItems,
  wouldCreateFolderCycle,
  type NoteFolderDoc,
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
  return { id: 'x', source: 'personal', title: 'T', plainText: '', folderId: null, favorite: false, sortOrder: Infinity, trashed: false, createdAtMs: 0, updatedAtMs: 0, ...partial }
}

function folder(partial: Partial<NoteFolderDoc> & { id: string }): NoteFolderDoc {
  return { workspace_id: 'ws1', author_id: 'u1', name: partial.id, parent_id: null, sort_order: 0, created_at_ms: 0, updated_at_ms: 0, ...partial }
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

describe('trash (soft delete)', () => {
  const items = [item({ id: 'a', trashed: false }), item({ id: 'b', trashed: true }), item({ id: 'c', trashed: false })]
  it('partitions active vs trashed without losing any', () => {
    expect(activeItems(items).map((i) => i.id)).toEqual(['a', 'c'])
    expect(trashedItems(items).map((i) => i.id)).toEqual(['b'])
  })
})

describe('sortByOrder / nextSortOrder', () => {
  it('orders by sortOrder then updatedAt, and lands new notes at the end', () => {
    const items = [
      item({ id: 'end', sortOrder: Infinity, updatedAtMs: 99 }),
      item({ id: 'first', sortOrder: 0, updatedAtMs: 1 }),
      item({ id: 'second', sortOrder: 1, updatedAtMs: 1 }),
    ]
    expect(sortByOrder(items).map((i) => i.id)).toEqual(['first', 'second', 'end'])
    expect(nextSortOrder(items)).toBe(2)
    expect(nextSortOrder([])).toBe(0)
  })
})

describe('notesInFolder', () => {
  it('returns active personal notes in a folder, ordered, excluding trashed + meetings', () => {
    const items = [
      item({ id: 'p2', source: 'personal', folderId: 'f1', sortOrder: 1 }),
      item({ id: 'p1', source: 'personal', folderId: 'f1', sortOrder: 0 }),
      item({ id: 'gone', source: 'personal', folderId: 'f1', trashed: true }),
      item({ id: 'm', source: 'meeting', folderId: 'f1' }),
      item({ id: 'other', source: 'personal', folderId: 'f2' }),
    ]
    expect(notesInFolder(items, 'f1').map((i) => i.id)).toEqual(['p1', 'p2'])
  })
})

describe('buildFolderTree', () => {
  it('nests by parent_id, sorts siblings, and surfaces orphans/cycles at the root', () => {
    const folders = [
      folder({ id: 'work', sort_order: 0 }),
      folder({ id: 'product', parent_id: 'work', sort_order: 1 }),
      folder({ id: 'launch', parent_id: 'work', sort_order: 0 }),
      folder({ id: 'orphan', parent_id: 'ghost', sort_order: 9 }),
    ]
    const tree = buildFolderTree(folders)
    expect(tree.map((n) => n.folder.id)).toEqual(['work', 'orphan'])
    expect(tree[0].children.map((n) => n.folder.id)).toEqual(['launch', 'product'])
  })
  it('does not infinite-loop on a parent cycle', () => {
    const folders = [folder({ id: 'a', parent_id: 'b' }), folder({ id: 'b', parent_id: 'a' })]
    expect(() => buildFolderTree(folders)).not.toThrow()
  })
})

describe('folderDescendantIds / wouldCreateFolderCycle', () => {
  const folders = [
    folder({ id: 'root' }),
    folder({ id: 'child', parent_id: 'root' }),
    folder({ id: 'grand', parent_id: 'child' }),
    folder({ id: 'sibling' }),
  ]
  it('collects the whole subtree', () => {
    expect(folderDescendantIds(folders, 'root').sort()).toEqual(['child', 'grand'])
    expect(folderDescendantIds(folders, 'grand')).toEqual([])
  })
  it('blocks moving a folder into itself or a descendant, allows valid moves', () => {
    expect(wouldCreateFolderCycle(folders, 'root', 'root')).toBe(true)
    expect(wouldCreateFolderCycle(folders, 'root', 'grand')).toBe(true)
    expect(wouldCreateFolderCycle(folders, 'root', null)).toBe(false)
    expect(wouldCreateFolderCycle(folders, 'sibling', 'root')).toBe(false)
  })
})

describe('reorderIds', () => {
  it('moves an id to a new index, clamps out-of-range, ignores unknown ids', () => {
    expect(reorderIds(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
    expect(reorderIds(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b'])
    expect(reorderIds(['a', 'b', 'c'], 'a', 99)).toEqual(['b', 'c', 'a'])
    expect(reorderIds(['a', 'b', 'c'], 'z', 0)).toEqual(['a', 'b', 'c'])
  })
})
