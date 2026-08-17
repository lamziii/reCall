'use client'

/**
 * Shared context every advanced-block NodeView reads. It carries:
 *  - `compact`: the block is on a tiny surface (dock / PiP / Active Session) → render a safe, read-only
 *    representation with an "Open full note" affordance instead of the full interactive editor.
 *  - `upload`: where media may be stored (workspace/author/note scope). Absent → uploads are disabled
 *    (e.g. demo/marketing surfaces with no Firebase auth) and the block shows a friendly note.
 *  - `openFullHref`: where "Open full note" navigates from a compact surface.
 *
 * Blocks that navigate (note-links, Open full note) use useNavigate() directly — safe under the App
 * Router anywhere. Nothing here bakes surface data into the Tiptap schema; it's pure runtime context.
 */
import { createContext, useContext } from 'react'

export interface EditorUploadTarget {
  workspaceId: string
  authorId: string
  /** The note the media belongs to — used only to organize the Storage path. */
  noteId?: string
}

export interface EditorSurfaceValue {
  compact: boolean
  upload?: EditorUploadTarget
  openFullHref?: string
}

export const EditorSurfaceContext = createContext<EditorSurfaceValue>({ compact: false })

export function useEditorSurface(): EditorSurfaceValue {
  return useContext(EditorSurfaceContext)
}
