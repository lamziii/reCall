'use client'

/**
 * Global recording dock — a compact pill fixed to the bottom of the /app shell, rendered by the app
 * layout (NOT any page) so it stays visible and in sync while the user navigates anywhere in Recall.
 *
 * Two states, per active session (local state; the dock persists across routes, so it survives
 * navigation and only resets when the session ends and the dock unmounts):
 *  - COLLAPSED (default): pulse · timer · waveform · status · Notes toggle · Pop Out · End.
 *  - EXPANDED: a lightweight notes panel floats ABOVE the pill (controls stay put). The panel edits the
 *    SAME notes store as /app/record and the PiP companion (useNotesEditor) — no duplicate note state.
 *
 * No transcript, no navigation, no dashboard widgets.
 */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Flag, Maximize2, PictureInPicture2, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActiveSession } from '@/data/active-session/active-session-context'
import { usePipCompanion } from '@/data/active-session/pip-companion'
import { useNotesEditor } from '@/data/active-session/use-notes-editor'
import { RichNotesEditor } from './rich-notes-editor'
import { VoiceWaveform } from './voice-waveform'
import { cn } from '@/lib/utils'

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** The floating notes panel shown above the dock when expanded. Uses the shared notes store. */
function DockNotesPanel({ onCollapse }: { onCollapse: () => void }) {
  const session = useActiveSession()
  const router = useRouter()
  const notes = useNotesEditor()
  const [justMarked, setJustMarked] = useState(false)
  const markTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (markTimer.current) clearTimeout(markTimer.current)
    }
  }, [])

  function handleMark() {
    session.markMoment()
    setJustMarked(true)
    if (markTimer.current) clearTimeout(markTimer.current)
    markTimer.current = setTimeout(() => setJustMarked(false), 1200)
  }

  return (
    <div className="pointer-events-auto flex w-[min(440px,calc(100vw-2rem))] flex-col rounded-xl border border-border bg-surface-raised shadow-lg">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-small font-medium text-foreground">My Notes</span>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-caption text-subtle-foreground" aria-live="polite">{notes.saveLabel}</span>
          <button
            type="button"
            onClick={() => router.push('/app/record')}
            aria-label="Open full notes"
            title="Open full notes"
            className="focus-ring flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:text-foreground"
          >
            <Maximize2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse notes"
            title="Collapse notes"
            className="focus-ring flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:text-foreground"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
      <RichNotesEditor
        key={notes.sessionId ?? 'none'}
        initialDoc={notes.initialDoc}
        getDoc={notes.getDoc}
        subscribe={notes.subscribe}
        onChange={notes.onChange}
        onBlur={notes.onBlur}
        onMarkMoment={notes.onMarkMoment}
        autofocus
        compact
        placeholder="Capture a thought…  /  for blocks"
        className="mt-1 h-[clamp(220px,32vh,320px)] overflow-y-auto px-4"
      />
      <div className="flex items-center px-3 py-2">
        <button
          type="button"
          onClick={handleMark}
          disabled={session.status !== 'recording'}
          aria-label="Mark this moment as important"
          className="focus-ring flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-caption font-medium text-foreground transition-fast hover:bg-surface-hover disabled:opacity-50"
        >
          <Flag className="size-3.5" />
          {justMarked ? 'Marked' : 'Mark moment'}
        </button>
      </div>
    </div>
  )
}

export function RecordingDock() {
  const session = useActiveSession()
  const pip = usePipCompanion()
  const [ending, setEnding] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Cmd/Ctrl+Shift+P → Pop Out (only while a session is active and PiP is supported/closed).
  useEffect(() => {
    if (!session.isActive || !pip.supported) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        if (!pip.isOpen) void pip.open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session.isActive, pip])

  if (!session.isActive) return null

  const recording = session.status === 'recording'
  const busyLabel =
    session.status === 'stopping' || session.status === 'uploading' || session.status === 'processing'
      ? 'Saving…'
      : session.status === 'preparing'
        ? 'Starting…'
        : 'Recording'

  async function handleEnd() {
    if (ending) return
    setEnding(true)
    await session.end()
    // provider resets + navigates; component unmounts as isActive flips false
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex flex-col items-center gap-2 px-4">
      {expanded && <DockNotesPanel onCollapse={() => setExpanded(false)} />}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-surface-raised/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-surface-raised/80"
      >
        {/* status + pulse */}
        <div className="flex items-center gap-2">
          <span
            className={cn('size-2 rounded-full', recording ? 'animate-pulse bg-danger' : 'bg-subtle-foreground')}
            aria-hidden
          />
          <span className="text-small font-medium text-foreground tabular-nums">{fmt(session.elapsedSeconds)}</span>
          <span className="hidden text-caption text-subtle-foreground sm:inline">{busyLabel}</span>
        </div>

        {/* real mic waveform */}
        <VoiceWaveform analyser={session.analyser} active={recording} barCount={20} className="w-28 sm:w-36" />

        {/* Notes toggle — click to expand the notes panel above the dock */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
          className={cn(
            'focus-ring flex items-center gap-1 rounded-full px-2.5 py-1.5 text-caption font-medium transition-fast',
            expanded ? 'bg-surface-active text-foreground' : 'text-subtle-foreground hover:bg-surface-hover hover:text-foreground',
          )}
        >
          Notes
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>

        {/* Pop Out — Document PiP (cross-tab companion). Honest disable when unsupported. */}
        <button
          type="button"
          onClick={() => void pip.open()}
          disabled={!pip.supported || pip.isOpen}
          title={pip.supported ? 'Pop out companion (⌘/Ctrl+Shift+P)' : 'Floating companion requires a supported browser'}
          aria-label={pip.supported ? 'Pop out companion' : 'Floating companion requires a supported browser'}
          className={cn(
            'focus-ring flex size-8 items-center justify-center rounded-full text-subtle-foreground transition-fast hover:text-foreground',
            (!pip.supported || pip.isOpen) && 'opacity-40 hover:text-subtle-foreground',
          )}
        >
          <PictureInPicture2 className="size-4" />
        </button>

        {/* End Session */}
        <button
          type="button"
          onClick={handleEnd}
          disabled={ending || !recording}
          aria-label="End session"
          className="focus-ring flex items-center gap-1.5 rounded-full bg-danger px-3 py-1.5 text-small font-medium text-white transition-fast hover:opacity-90 disabled:opacity-60"
        >
          <Square className="size-3.5 fill-current" />
          End
        </button>
      </div>
    </div>
  )
}
