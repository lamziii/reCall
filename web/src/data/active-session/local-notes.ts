/**
 * Crash-resistant local persistence for in-progress session notes. Mirrors data/live/local-audio.ts
 * (same IndexedDB pattern) but in its own DB so it needs no version coordination with the audio store.
 *
 * This is the middle tier of the autosave stack: React state (instant) → THIS (survives a crash/refresh
 * with no network) → debounced Firestore (durable, cross-device). Keyed by session + author.
 */
import type { NoteMark } from './types'
import type { NotesDoc } from './notes-doc'

const DB_NAME = 'recall-active-notes'
const STORE = 'notes'

export interface LocalNoteRecord {
  doc: NotesDoc
  plainText: string
  marks: NoteMark[]
  savedAtMs: number
}

function key(sessionId: string, authorId: string): string {
  return `${sessionId}:${authorId}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putLocalNote(sessionId: string, authorId: string, record: LocalNoteRecord): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(record, key(sessionId, authorId))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function getLocalNote(sessionId: string, authorId: string): Promise<LocalNoteRecord | null> {
  const db = await openDb()
  try {
    return await new Promise<LocalNoteRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key(sessionId, authorId))
      req.onsuccess = () => resolve((req.result as LocalNoteRecord) ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function deleteLocalNote(sessionId: string, authorId: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key(sessionId, authorId))
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve() // best-effort cleanup
    })
  } finally {
    db.close()
  }
}
