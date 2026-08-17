'use client'

/**
 * Media blocks — image / video / audio / file. Each is an atomic block node that stores ONLY metadata
 * (url + Storage path + name + size + mime + caption); the binary lives in Firebase Storage. A freshly
 * inserted node auto-opens the file picker; uploads show progress/error. On compact surfaces (dock/PiP)
 * media renders as a read-only chip with "Open full note" — never the full uploader.
 *
 * Persistence is via the node's JSON attrs (round-trips through Firestore untouched); renderHTML keeps
 * a data-* snapshot for copy/export fidelity but is not the source of truth.
 */
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps, type Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { AlertCircle, Download, FileIcon, Film, ImageIcon, Music, Trash2, Upload, X } from 'lucide-react'
import { uploadNoteMedia, formatBytes, type MediaUpload } from '@/data/notes/note-media'
import { useEditorSurface } from './editor-surface'
import { cn } from '@/lib/utils'

export type MediaKind = 'image' | 'video' | 'audio' | 'file'
type Status = 'empty' | 'uploading' | 'ready' | 'error'

/** Files handed to a just-inserted media node by editor-level paste/drop (can't ride in JSON attrs).
 *  Keyed by a transient id stored on the node; the NodeView consumes + clears it on mount. */
const pendingFiles = new Map<string, File>()
export function stashPendingFile(file: File): string {
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  pendingFiles.set(id, file)
  return id
}

const ACCEPT: Record<MediaKind, string> = { image: 'image/*', video: 'video/*', audio: 'audio/*', file: '*/*' }
const LABEL: Record<MediaKind, string> = { image: 'image', video: 'video', audio: 'audio', file: 'file' }
const KIND_ICON = { image: ImageIcon, video: Film, audio: Music, file: FileIcon } as const

function mediaNode(kind: MediaKind) {
  return Node.create({
    name: kind,
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return {
        status: { default: 'empty' },
        url: { default: null },
        path: { default: null },
        name: { default: '' },
        size: { default: 0 },
        mime: { default: '' },
        caption: { default: '' },
        width: { default: null }, // image only (px)
        pendingId: { default: null }, // transient: a paste/drop file waiting to upload
      }
    },
    parseHTML() {
      return [{ tag: `div[data-media="${kind}"]`, getAttrs: (el) => ({ status: (el as HTMLElement).getAttribute('data-url') ? 'ready' : 'empty', url: (el as HTMLElement).getAttribute('data-url'), name: (el as HTMLElement).getAttribute('data-name') ?? '' }) }]
    },
    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes({ 'data-media': kind, 'data-url': HTMLAttributes.url ?? '', 'data-name': HTMLAttributes.name ?? '', class: 'recall-media' })]
    },
    addNodeView() {
      return ReactNodeViewRenderer((props: NodeViewProps) => <MediaView kind={kind} {...props} />)
    },
  })
}

export const ImageBlock = mediaNode('image')
export const VideoBlock = mediaNode('video')
export const AudioBlock = mediaNode('audio')
export const FileBlock = mediaNode('file')

/** Inserts an empty media node of `kind`; its NodeView opens the picker. */
export function insertMedia(kind: MediaKind, editor: Editor, range: { from: number; to: number }) {
  editor.chain().focus().deleteRange(range).insertContent({ type: kind, attrs: { status: 'empty' } }).run()
}

function MediaView({ kind, node, updateAttributes, editor, deleteNode }: { kind: MediaKind } & NodeViewProps) {
  const attrs = node.attrs as { status: Status; url: string | null; name: string; size: number; mime: string; caption: string; width: number | null; pendingId: string | null }
  const surface = useEditorSurface()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<MediaUpload | null>(null)
  const promptedRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const editable = editor.isEditable && !surface.compact

  const startUpload = (file: File) => {
    if (!file) return
    if (!surface.upload) {
      setError('Sign in to upload media.')
      updateAttributes({ status: 'error' })
      return
    }
    setError('')
    setProgress(0)
    updateAttributes({ status: 'uploading' })
    const up = uploadNoteMedia(surface.upload, file, setProgress)
    uploadRef.current = up
    up.promise
      .then((m) => updateAttributes({ status: 'ready', url: m.url, path: m.path, name: m.name, size: m.size, mime: m.mime }))
      .catch((e) => {
        if ((e as { code?: string })?.code === 'storage/canceled') return
        setError('Upload failed. Try again.')
        updateAttributes({ status: 'error' })
      })
  }

  // Fresh empty node: upload a paste/drop file if one is waiting, else auto-open the picker once.
  useEffect(() => {
    if (attrs.status !== 'empty' || !editable || promptedRef.current) return
    if (attrs.pendingId && pendingFiles.has(attrs.pendingId)) {
      promptedRef.current = true
      const file = pendingFiles.get(attrs.pendingId)!
      pendingFiles.delete(attrs.pendingId)
      updateAttributes({ pendingId: null })
      startUpload(file)
      return
    }
    if (surface.upload) {
      promptedRef.current = true
      inputRef.current?.click()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attrs.status, editable, surface.upload, attrs.pendingId])

  useEffect(() => () => uploadRef.current?.cancel(), [])

  // ---- compact surface: read-only chip -----------------------------------------------------------
  if (surface.compact) {
    const Icon = KIND_ICON[kind]
    return (
      <NodeViewWrapper className="recall-media-block">
        <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-2.5 py-2 text-caption text-muted-foreground" contentEditable={false}>
          <Icon className="size-4 shrink-0 text-subtle-foreground" />
          <span className="min-w-0 flex-1 truncate">{attrs.name || `${LABEL[kind]} attachment`}</span>
          {surface.openFullHref && (
            <button type="button" onClick={() => navigate(surface.openFullHref!)} className="shrink-0 font-medium text-foreground hover:underline">Open full note</button>
          )}
        </div>
      </NodeViewWrapper>
    )
  }

  const hiddenInput = (
    <input ref={inputRef} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) startUpload(f); e.target.value = '' }} />
  )

  return (
    <NodeViewWrapper className="recall-media-block">
      <div className="group relative" contentEditable={false}>
        {hiddenInput}

        {attrs.status === 'uploading' && (
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <div className="mb-2 flex items-center gap-2 text-small text-muted-foreground">
              <Upload className="size-4 animate-pulse" /> Uploading…
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-active">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        )}

        {attrs.status === 'error' && (
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface p-3 text-small text-muted-foreground">
            <AlertCircle className="size-4 shrink-0 text-danger" />
            <span className="flex-1">{error || 'Something went wrong.'}</span>
            {editable && <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-foreground hover:underline">Retry</button>}
            {editable && <button type="button" onClick={() => deleteNode()} aria-label="Remove" className="text-subtle-foreground hover:text-foreground [&>svg]:size-4"><X /></button>}
          </div>
        )}

        {attrs.status === 'empty' && (
          <EmptyMedia kind={kind} editable={editable} onPick={() => inputRef.current?.click()} onUrl={kind === 'image' || kind === 'video' ? (url) => updateAttributes({ status: 'ready', url, name: url.split('/').pop() || url, mime: kind === 'image' ? 'image/*' : 'video/*' }) : undefined} onRemove={() => deleteNode()} />
        )}

        {attrs.status === 'ready' && attrs.url && (
          <MediaReady kind={kind} attrs={attrs} editable={editable} onCaption={(caption) => updateAttributes({ caption })} onWidth={(width) => updateAttributes({ width })} onReplace={() => inputRef.current?.click()} onDelete={() => deleteNode()} />
        )}
      </div>
    </NodeViewWrapper>
  )
}

function EmptyMedia({ kind, editable, onPick, onUrl, onRemove }: { kind: MediaKind; editable: boolean; onPick: () => void; onUrl?: (url: string) => void; onRemove: () => void }) {
  const [url, setUrl] = useState('')
  const Icon = KIND_ICON[kind]
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-4">
      <button type="button" disabled={!editable} onClick={onPick} className="focus-ring flex w-full items-center gap-2 rounded-md text-left text-small text-muted-foreground transition-fast hover:text-foreground">
        <Icon className="size-5 text-subtle-foreground" />
        <span>Click to add {LABEL[kind]}{editable ? '' : ' (read-only)'}</span>
      </button>
      {onUrl && editable && (
        <div className="mt-2 flex items-center gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={`or paste ${LABEL[kind]} URL`} className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-raised px-2 py-1 text-small text-foreground outline-none focus:border-border-accent" onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) onUrl(url.trim()) }} />
          <button type="button" onClick={() => url.trim() && onUrl(url.trim())} className="rounded-md border border-border-subtle px-2 py-1 text-caption font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground">Embed</button>
          <button type="button" onClick={onRemove} aria-label="Remove" className="text-subtle-foreground hover:text-foreground [&>svg]:size-4"><X /></button>
        </div>
      )}
    </div>
  )
}

function MediaReady({ kind, attrs, editable, onCaption, onWidth, onReplace, onDelete }: {
  kind: MediaKind
  attrs: { url: string | null; name: string; size: number; mime: string; caption: string; width: number | null }
  editable: boolean
  onCaption: (v: string) => void
  onWidth: (v: number) => void
  onReplace: () => void
  onDelete: () => void
}) {
  const [duration, setDuration] = useState<string>('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const actions = editable && (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-fast group-hover:opacity-100">
      <button type="button" onClick={onReplace} title="Replace" className="flex size-7 items-center justify-center rounded-md bg-surface-raised/90 text-subtle-foreground shadow-sm hover:text-foreground [&>svg]:size-4"><Upload /></button>
      <button type="button" onClick={onDelete} title="Delete" className="flex size-7 items-center justify-center rounded-md bg-surface-raised/90 text-subtle-foreground shadow-sm hover:text-danger [&>svg]:size-4"><Trash2 /></button>
    </div>
  )

  const caption = editable ? (
    <input value={attrs.caption} onChange={(e) => onCaption(e.target.value)} placeholder="Add a caption…" className="mt-1.5 w-full bg-transparent text-center text-caption text-muted-foreground outline-none placeholder:text-subtle-foreground" />
  ) : attrs.caption ? (
    <p className="mt-1.5 text-center text-caption text-muted-foreground">{attrs.caption}</p>
  ) : null

  if (kind === 'image') {
    return (
      <figure ref={wrapRef} className="relative">
        {actions}
        <div className="relative inline-block max-w-full" style={{ width: attrs.width ? `${attrs.width}px` : undefined }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user media from Firebase Storage, not a static asset */}
          <img src={attrs.url!} alt={attrs.name} className="block max-w-full rounded-lg" />
          {editable && <ResizeHandle wrapRef={wrapRef} onWidth={onWidth} />}
        </div>
        {caption}
      </figure>
    )
  }
  if (kind === 'video') {
    return (
      <figure className="relative">
        {actions}
        <video src={attrs.url!} controls className="max-h-[70vh] w-full rounded-lg bg-black" />
        {caption}
      </figure>
    )
  }
  if (kind === 'audio') {
    return (
      <div className="relative rounded-lg border border-border-subtle bg-surface p-3">
        {actions}
        <div className="mb-2 flex items-center gap-2 text-small text-foreground">
          <Music className="size-4 shrink-0 text-subtle-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">{attrs.name || 'Audio'}</span>
          {duration && <span className="shrink-0 text-caption tabular-nums text-subtle-foreground">{duration}</span>}
        </div>
        <audio src={attrs.url!} controls className="w-full" onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d)) setDuration(`${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`) }} />
        {caption}
      </div>
    )
  }
  // file
  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-raised text-subtle-foreground [&>svg]:size-5"><FileIcon /></span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-small font-medium text-foreground">{attrs.name || 'Attachment'}</span>
        <span className="text-caption text-subtle-foreground">{[attrs.mime, formatBytes(attrs.size)].filter(Boolean).join(' · ')}</span>
      </div>
      <a href={attrs.url!} target="_blank" rel="noopener noreferrer" download={attrs.name} className="focus-ring flex size-8 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-4" aria-label="Download"><Download /></a>
      {editable && <button type="button" onClick={onDelete} aria-label="Delete" className="text-subtle-foreground opacity-0 transition-fast hover:text-danger group-hover:opacity-100 [&>svg]:size-4"><Trash2 /></button>}
    </div>
  )
}

/** Drag the right edge to resize an image (px width, clamped to the container). */
function ResizeHandle({ wrapRef, onWidth }: { wrapRef: React.RefObject<HTMLDivElement | null>; onWidth: (w: number) => void }) {
  const dragging = useRef(false)
  return (
    <span
      role="separator"
      aria-label="Resize image"
      onPointerDown={(e) => {
        e.preventDefault()
        dragging.current = true
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !wrapRef.current) return
        const left = wrapRef.current.getBoundingClientRect().left
        const max = wrapRef.current.parentElement?.getBoundingClientRect().width ?? 900
        onWidth(Math.round(Math.max(120, Math.min(e.clientX - left, max))))
      }}
      onPointerUp={(e) => { dragging.current = false; ;(e.target as HTMLElement).releasePointerCapture(e.pointerId) }}
      className="absolute right-1 top-1/2 h-10 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-foreground/40 opacity-0 transition-fast group-hover:opacity-100"
    />
  )
}
