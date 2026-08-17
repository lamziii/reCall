'use client'

/**
 * Note media uploads → Firebase Storage. Binary NEVER goes into Firestore/Tiptap JSON; the editor
 * stores only the returned metadata (url + path + name + size + mime). Files land under the existing
 * workspace-scoped documents path (`workspaces/{ws}/documents/notes/...`), already covered by
 * storage.rules (workspace members read/write) — no rules change.
 */
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseStorage } from '@/lib/firebase/client'
import type { EditorUploadTarget } from '@/components/recording/blocks/editor-surface'

export interface UploadedMedia {
  url: string
  path: string
  name: string
  size: number
  mime: string
}

export interface MediaUpload {
  promise: Promise<UploadedMedia>
  cancel: () => void
}

function fileId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Starts a resumable upload. `onProgress` gets 0..1. Returns the promise + a cancel handle. */
export function uploadNoteMedia(target: EditorUploadTarget, file: File, onProgress: (fraction: number) => void): MediaUpload {
  const safeName = (file.name || 'file').replace(/[^\w.\- ]+/g, '_').slice(0, 120)
  const scope = target.noteId || target.authorId
  const path = `workspaces/${target.workspaceId}/documents/notes/${scope}/${fileId()}-${safeName}`
  const task = uploadBytesResumable(storageRef(getFirebaseStorage(), path), file, { contentType: file.type || 'application/octet-stream' })

  const promise = new Promise<UploadedMedia>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress(snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({ url, path, name: file.name, size: file.size, mime: file.type || 'application/octet-stream' })
        } catch (e) {
          reject(e)
        }
      },
    )
  })

  return { promise, cancel: () => task.cancel() }
}

/** Human-readable file size. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`
}
