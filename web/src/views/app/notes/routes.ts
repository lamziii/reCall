import type { NoteListItem } from '@/data/notes/note-model'

/** Single source of truth for Notes URLs. Personal notes and meeting notes live under distinct
 *  segments so a meeting note (whose canonical content is its Session's) never collides with a
 *  personal note id, and static routes (all/trash) always win over the [id] catch-all. */
export const NOTES_BASE = '/app/notes'
export const NOTES_ALL = `${NOTES_BASE}/all`
export const NOTES_TRASH = `${NOTES_BASE}/trash`

export const notePath = (id: string) => `${NOTES_BASE}/${id}`
export const meetingPath = (sessionId: string) => `${NOTES_BASE}/session/${sessionId}`

/** The in-Notes URL for any list item, routing meeting notes to the session-backed editor. */
export function itemPath(item: NoteListItem): string {
  return item.source === 'meeting' && item.sessionId ? meetingPath(item.sessionId) : notePath(item.noteId ?? item.id)
}
