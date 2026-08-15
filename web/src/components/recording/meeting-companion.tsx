'use client'

/**
 * Meeting Companion — the tiny floating utility rendered inside the Document PiP window. It is another
 * VIEW over the existing Active Session (same recorder/timer/notes/analyser); it owns no state.
 *
 * Layout (top → bottom): title · textual status + timer · My Notes (the main surface) · small
 * waveform · Mark moment / End. No navigation, no app shell, no transcript.
 */
import { useEffect, useRef, useState } from 'react'
import { Flag, Square } from 'lucide-react'
import { useActiveSession } from '@/data/active-session/active-session-context'
import { useNotesEditor } from '@/data/active-session/use-notes-editor'
import { RichNotesEditor } from './rich-notes-editor'
import { VoiceWaveform } from './voice-waveform'

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MeetingCompanion({ onClose }: { onClose: () => void }) {
  const session = useActiveSession()
  const notes = useNotesEditor()
  const [ending, setEnding] = useState(false)
  const [justMarked, setJustMarked] = useState(false)
  const markTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (markTimer.current) clearTimeout(markTimer.current)
    }
  }, [])

  const recording = session.status === 'recording'

  function handleMark() {
    session.markMoment()
    setJustMarked(true)
    if (markTimer.current) clearTimeout(markTimer.current)
    markTimer.current = setTimeout(() => setJustMarked(false), 1200)
  }

  async function handleEnd() {
    if (ending) return
    setEnding(true)
    await session.end() // guarded against double-end; flushes notes, saves audio, hands off to review
    onClose() // close the PiP; Session Review opens in the main Recall window
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-bg px-4 pb-3 pt-3 text-foreground">
      {/* header */}
      <div className="flex items-center justify-between">
        <span className="text-caption font-medium uppercase tracking-widest text-subtle-foreground">Recall</span>
      </div>
      <h1 className="mt-0.5 truncate text-small font-semibold text-foreground">{session.title || 'Active session'}</h1>

      {/* status + timer (textual, not waveform-only) */}
      <div className="mt-1 flex items-center gap-2">
        <span className={`size-2 rounded-full ${recording ? 'animate-pulse bg-danger' : 'bg-subtle-foreground'}`} aria-hidden />
        <span className="text-caption text-muted-foreground">{recording ? 'Recording' : session.status === 'preparing' ? 'Starting…' : 'Saving…'}</span>
        <span className="ml-auto text-small font-medium tabular-nums text-foreground">{fmt(session.elapsedSeconds)}</span>
      </div>

      {/* My Notes — the main surface */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-caption font-medium text-subtle-foreground">My Notes</span>
          <span className="text-caption text-subtle-foreground" aria-live="polite">{notes.saveLabel}</span>
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
          placeholder="Type your notes…  /  for blocks"
          className="min-h-0 flex-1 overflow-y-auto"
        />
      </div>

      {/* compact dock: waveform + actions */}
      <div className="mt-2 flex flex-col gap-2 border-t border-border-subtle pt-2">
        <VoiceWaveform analyser={session.analyser} active={recording} barCount={20} className="h-6 w-full" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMark}
            disabled={!recording}
            aria-label="Mark this moment as important"
            className="focus-ring flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-caption font-medium text-foreground transition-fast hover:bg-surface-hover disabled:opacity-50"
          >
            <Flag className="size-3.5" />
            {justMarked ? 'Marked' : 'Mark moment'}
          </button>
          <button
            type="button"
            onClick={handleEnd}
            disabled={ending || !recording}
            aria-label="End session"
            className="focus-ring ml-auto flex items-center gap-1.5 rounded-full bg-danger px-3 py-1.5 text-caption font-medium text-white transition-fast hover:opacity-90 disabled:opacity-60"
          >
            <Square className="size-3 fill-current" />
            End
          </button>
        </div>
      </div>
    </div>
  )
}
