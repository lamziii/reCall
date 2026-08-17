'use client'

/**
 * NoteEditorFrame — the presentational chrome for an open note: quiet breadcrumb, optional page icon,
 * a big borderless title, a compact actions menu, and the shared RichNotesEditor. It owns no data;
 * PersonalNotePane and MeetingNotePane supply content + callbacks so both note sources render an
 * identical editing experience. Deliberately minimal — no toolbar (blocks come from `/`).
 */
import { ChevronRight } from 'lucide-react'
import { RichNotesEditor } from '@/components/recording/rich-notes-editor'
import { EmojiPopover } from '@/components/notes/emoji-popover'
import { useNotesEditorOptions, notesWidthClass } from '@/data/notes/use-notes-editor-options'
import { useRecallPreferences } from '@/settings/settings-context'
import { useNavigate } from '@/lib/router-compat'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import type { NotesDoc } from '@/data/active-session/notes-doc'
import { DEFAULT_PAPER_STYLE, type PaperStyle } from '@/data/notes/note-model'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

export function NoteEditorFrame({
  crumbs,
  icon,
  onIconChange,
  title,
  onTitleChange,
  actions,
  banner,
  saveLabel,
  initialDoc,
  onDocChange,
  titleKey,
  paperStyle = DEFAULT_PAPER_STYLE,
}: {
  crumbs: Crumb[]
  icon: string | null
  /** When provided, the icon is editable (personal notes). Omit for read-only sources (meetings). */
  onIconChange?: (icon: string | null) => void
  title: string
  /** Omit to render the title read-only (e.g. meeting notes mirror their Session title). */
  onTitleChange?: (title: string) => void
  actions?: React.ReactNode
  banner?: React.ReactNode
  saveLabel?: string
  initialDoc: NotesDoc
  onDocChange: (doc: NotesDoc, plainText: string) => void
  /** Remount key so switching notes reseeds the title input + editor. */
  titleKey: string
  /** Page/notebook background for the writing canvas. Defaults to blank. */
  paperStyle?: PaperStyle
}) {
  const navigate = useNavigate()
  const editorOptions = useNotesEditorOptions()
  const { preferences } = useRecallPreferences()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const widthClass = notesWidthClass(preferences.notes.editorWidth)
  const iconEditable = Boolean(onIconChange)
  // Media uploads scope to workspace/author/note. titleKey is the note (or session) id → Storage path.
  const uploadTarget = user?.id ? { workspaceId, authorId: user.id, noteId: titleKey } : undefined

  const iconButton = (
    <button
      type="button"
      className={cn(
        'focus-ring flex items-center justify-center rounded-md text-[2rem] leading-none transition-fast',
        iconEditable && 'hover:bg-surface-hover',
        !icon && 'text-[1.5rem]',
      )}
      aria-label={icon ? 'Change page icon' : 'Add page icon'}
    >
      {icon ?? '📄'}
    </button>
  )

  return (
    <div className="recall-paper flex h-full flex-1 flex-col overflow-y-auto" data-paper={paperStyle}>
      <div className={cn('mx-auto flex w-full flex-1 flex-col px-6 pb-24 pt-8 sm:px-10', widthClass)}>
        {/* Breadcrumb + actions */}
        <div className="mb-3 flex items-center gap-2">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-caption text-subtle-foreground">
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-60" />}
                {c.to ? (
                  <button type="button" onClick={() => navigate(c.to!)} className="focus-ring truncate rounded px-0.5 transition-fast hover:text-foreground">
                    {c.label}
                  </button>
                ) : (
                  <span className="truncate">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          {saveLabel && <span className="shrink-0 text-caption text-subtle-foreground" aria-live="polite">{saveLabel}</span>}
          {actions}
        </div>

        {banner}

        {/* Icon */}
        <div className="mb-1 -ml-1">
          {iconEditable ? (
            <EmojiPopover value={icon} onPick={(e) => onIconChange!(e)} trigger={iconButton} />
          ) : (
            icon && <span className="text-[2rem] leading-none">{icon}</span>
          )}
        </div>

        {/* Title */}
        {onTitleChange ? (
          <input
            key={`title-${titleKey}`}
            type="text"
            defaultValue={title}
            placeholder="Untitled"
            aria-label="Note title"
            onChange={(e) => onTitleChange(e.target.value)}
            className="mb-2 w-full bg-transparent text-h1 font-semibold text-foreground outline-none placeholder:text-subtle-foreground"
          />
        ) : (
          <h1 className="mb-2 w-full text-h1 font-semibold text-foreground">{title || 'Untitled'}</h1>
        )}

        {/* Editor — the SAME Tiptap editor as meeting notes. */}
        <RichNotesEditor
          key={`editor-${titleKey}`}
          initialDoc={initialDoc}
          onChange={(doc, plainText) => onDocChange(doc, plainText)}
          options={editorOptions}
          uploadTarget={uploadTarget}
          autofocus
          placeholder="Start writing…  /  for blocks"
          className="recall-notes-roomy flex-1"
        />
      </div>
    </div>
  )
}
