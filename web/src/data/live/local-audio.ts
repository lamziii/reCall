// Local, Firebase-free store for recording audio. Blobs live in IndexedDB (localStorage can't
// hold binary) keyed by session id, so playback survives a refresh without Cloud Storage / Blaze.
// ponytail: this is the demo stand-in for Storage; swap for the real object store when Firebase
// is dropped. Keyed by sessionId so the review page can look audio up with no extra Firestore field.
const DB_NAME = 'recall-local'
const STORE = 'audio'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putLocalAudio(sessionId: string, blob: Blob): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, sessionId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function getLocalAudioBlob(sessionId: string): Promise<Blob | null> {
  const db = await openDb()
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(sessionId)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}
