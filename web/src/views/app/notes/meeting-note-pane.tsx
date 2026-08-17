'use client'

/**
 * MeetingNotePane (/app/notes/session/[sessionId]) — a meeting note opened as a first-class Notes
 * page. It edits the EXACT canonical slot the live session/dock/PiP wrote (sessions/{id}.user_notes.
 * {authorId}) via saveSessionNote, so edits here and in the Session Notes tab are the same data — no
 * duplication. Title mirrors the Session (read-only here). A banner links back to the full Session.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from '@/lib/router-compat'
import { ExternalLink, MoreHorizontal, Star, Video } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { subscribeSession } from '@/data/live/live-store'
import { saveSessionNote } from '@/data/active-session/notes-store'
import { updateMeetingNoteMeta } from '@/data/notes/notes-store'
import { toNotesDoc, type NotesDoc } from '@/data/active-session/notes-doc'
import type { LiveSessionDoc, SessionUserNoteDoc } from '@/data/live/types'
import { asPaperStyle, displayTitle, type PaperStyle } from '@/data/notes/note-model'
import { PageStyleItems } from '@/components/notes/page-style-menu'
import { NOTES_BASE } from './routes'
import { NoteEditorFrame, type Crumb } from './note-editor-frame'

const SAVE_DEBOUNCE_MS = 1200

export function MeetingNotePane() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const authorId = user?.id ?? 'unknown'

  const [session, setSession] = useState<LiveSessionDoc | null>(null)
  const [status, setStatus] = useState<'loading' | 'saving' | 'saved' | 'notfound'>('loading')
  const [favorite, setFavorite] = useState(false)
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('blank')

  const marksRef = useRef<SessionUserNoteDoc['marks']>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (!sessionId) return
    setStatus('loading')
    return subscribeSession(
      sessionId,
      (s) => {
        if (!s) { setStatus('notfound'); return }
        setSession(s)
        const slot = s.user_notes?.[authorId]
        // Seed marks + favorite once; live re-renders must not clobber in-flight edits.
        if (!seeded.current) {
          marksRef.current = slot?.marks ?? []
          setFavorite(Boolean((slot as { favorite?: boolean } | undefined)?.favorite))
          setPaperStyle(asPaperStyle((slot as { paper_style?: string } | undefined)?.paper_style))
          seeded.current = true
        }
        setStatus((prev) => (prev === 'loading' ? 'saved' : prev))
      },
      () => setStatus('notfound'),
    )
  }, [sessionId, authorId])

  const slot = session?.user_notes?.[authorId]
  const initialDoc = useMemo(() => toNotesDoc(slot ?? null), [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    async (doc: NotesDoc, plainText: string) => {
      if (!sessionId) return
      setStatus('saving')
      try {
        await saveSessionNote(sessionId, { content: plainText, doc, marks: marksRef.current, authorId, workspaceId, updatedAtMs: Date.now() })
        setStatus('saved')
      } catch {
        setStatus('saving')
      }
    },
    [sessionId, authorId, workspaceId],
  )

  const scheduleSave = useCallback(
    (doc: NotesDoc, plainText: string) => {
      setStatus('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void persist(doc, plainText), SAVE_DEBOUNCE_MS)
    },
    [persist],
  )

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (status === 'loading') {
    return <div className="flex flex-1 items-center justify-center text-small text-subtle-foreground">Loading…</div>
  }
  if (status === 'notfound' || !session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title="Session not found" description="This meeting may have been removed." action={<Button variant="secondary" onClick={() => navigate(NOTES_BASE)}>Back to Notes</Button>} />
      </div>
    )
  }

  const sessionUrl = `/app/sessions/${session.id}?tab=notes`
  const crumbs: Crumb[] = [{ label: 'Notes', to: NOTES_BASE }, { label: 'Meeting Notes' }]

  const banner = (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-caption text-muted-foreground">
      <Video className="size-3.5 shrink-0 text-subtle-foreground" />
      <span className="min-w-0 flex-1 truncate">From meeting <span className="font-medium text-foreground">{displayTitle(session.title)}</span></span>
      <button type="button" onClick={() => navigate(sessionUrl)} className="focus-ring inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium text-foreground transition-fast hover:bg-surface-hover">
        Open session <ExternalLink className="size-3" />
      </button>
    </div>
  )

  function toggleFavorite() {
    const next = !favorite
    setFavorite(next)
    void updateMeetingNoteMeta(session!.id, authorId, { favorite: next })
  }

  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button type="button" aria-label="Note actions" className="focus-ring flex size-8 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-4">
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent width={200} placement="bottom-end">
        <DropdownMenuItem icon={<Star />} onSelect={toggleFavorite}>{favorite ? 'Remove favorite' : 'Add to favorites'}</DropdownMenuItem>
        <DropdownMenuItem icon={<ExternalLink />} onSelect={() => navigate(sessionUrl)}>Open session</DropdownMenuItem>
        <DropdownMenuSeparator />
        <PageStyleItems
          value={paperStyle}
          onChange={(paper) => { setPaperStyle(paper); void updateMeetingNoteMeta(session!.id, authorId, { paperStyle: paper }) }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <NoteEditorFrame
      titleKey={session.id}
      crumbs={crumbs}
      icon={null}
      title={displayTitle(session.title)}
      actions={actions}
      banner={banner}
      saveLabel={status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
      initialDoc={initialDoc}
      onDocChange={(doc, plainText) => scheduleSave(doc, plainText)}
      paperStyle={paperStyle}
    />
  )
}
