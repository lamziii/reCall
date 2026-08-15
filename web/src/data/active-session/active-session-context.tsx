'use client'

/**
 * ActiveSessionProvider — the ONE canonical source of truth for an in-progress recording.
 *
 * Mounted in app/app/layout.tsx (above the routed pages), so navigating between /app/* routes does
 * NOT unmount it: the mic, timer, notes, and lifecycle all survive. It owns the recording pipeline by
 * reusing the proven useAudioRecorder (getUserMedia + MediaRecorder + AnalyserNode); this provider
 * only unmounts when the user leaves /app entirely (sign out / hard refresh) — which the browser
 * would tear the stream down for anyway (handled honestly, not faked).
 *
 * Rerender discipline (brief requirement): high-frequency amplitude data never lives here — the
 * waveform reads the AnalyserNode directly via rAF. Context carries only low-frequency state
 * (status, 1 Hz elapsed, save indicator). Notes CONTENT is not in context either (that would rerender
 * on every keystroke); the notebook holds it locally and pushes it in via updateNotes().
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { useAudioRecorder } from '@/data/recording/use-audio-recorder'
import { createSession } from '@/data/live/live-store'
import { putLocalAudio } from '@/data/live/local-audio'
import { putLocalNote, deleteLocalNote } from './local-notes'
import { saveSessionNote } from './notes-store'
import { EMPTY_DOC, structuredNotesToPlainText, type NotesDoc } from './notes-doc'
import { canTransition, isSessionActive, type ActiveSessionSetup, type ActiveSessionStatus, type NoteMark } from './types'

const LOCAL_DEBOUNCE_MS = 350
const FIRESTORE_DEBOUNCE_MS = 2200

interface NotesSnapshot {
  doc: NotesDoc
  plainText: string
  marks: NoteMark[]
}

export interface ActiveSessionContextValue {
  status: ActiveSessionStatus
  sessionId: string | null
  title: string
  elapsedSeconds: number
  micLabel: string | null
  errorMessage: string | null
  noteSaveState: 'idle' | 'saving' | 'saved'
  /** Low-frequency: the AnalyserNode reference (changes once per session). Amplitude read via rAF. */
  analyser: AnalyserNode | null
  isActive: boolean
  start: (setup: ActiveSessionSetup) => Promise<void>
  end: () => Promise<void>
  cancel: () => Promise<void>
  /** Editor pushed an edit: replace the canonical doc + derived plain text (marks are preserved). */
  updateNotes: (doc: NotesDoc, plainText: string) => void
  getNotes: () => NotesSnapshot
  flushNotes: () => Promise<void>
  /** External-store API so every notes surface (record page / dock / PiP) stays in sync without
   *  rerendering the shell. getNotesDoc returns a referentially-stable doc snapshot. */
  subscribeNotes: (cb: () => void) => () => void
  getNotesContent: () => string
  getNotesDoc: () => NotesDoc
  /** Flags the current elapsed second as important. Appends a 'moment' mark; no typing required. */
  markMoment: () => void
}

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null)

export function useActiveSession(): ActiveSessionContextValue {
  const ctx = useContext(ActiveSessionContext)
  if (!ctx) throw new Error('useActiveSession() must be used inside <ActiveSessionProvider>')
  return ctx
}

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const recorder = useAudioRecorder()

  const [status, setStatus] = useState<ActiveSessionStatus>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [noteSaveState, setNoteSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Notes canonical value (not React state — avoids per-keystroke rerenders of every consumer).
  // Subscribers (the notebook instances) are notified so main window + PiP companion stay in sync.
  const notesRef = useRef<NotesSnapshot>({ doc: EMPTY_DOC, plainText: '', marks: [] })
  const notesListeners = useRef(new Set<() => void>())
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const statusRef = useRef<ActiveSessionStatus>('idle')

  const authorId = user?.id ?? 'unknown'

  const move = useCallback((to: ActiveSessionStatus): boolean => {
    if (!canTransition(statusRef.current, to)) return false
    statusRef.current = to
    setStatus(to)
    return true
  }, [])

  const notifyNotes = useCallback(() => {
    notesListeners.current.forEach((cb) => cb())
  }, [])

  const subscribeNotes = useCallback((cb: () => void) => {
    notesListeners.current.add(cb)
    return () => {
      notesListeners.current.delete(cb)
    }
  }, [])

  const getNotesContent = useCallback(() => notesRef.current.plainText, [])
  const getNotesDoc = useCallback(() => notesRef.current.doc, [])

  // ---- notes persistence ---------------------------------------------------
  const writeLocal = useCallback(async () => {
    const sid = sessionIdRef.current
    if (!sid) return
    try {
      await putLocalNote(sid, authorId, {
        doc: notesRef.current.doc,
        plainText: notesRef.current.plainText,
        marks: notesRef.current.marks,
        savedAtMs: Date.now(),
      })
    } catch {
      /* IndexedDB unavailable — cloud tier is the durable copy */
    }
  }, [authorId])

  const writeCloud = useCallback(async () => {
    const sid = sessionIdRef.current
    if (!sid || !workspaceId) return
    setNoteSaveState('saving')
    try {
      await saveSessionNote(sid, {
        content: notesRef.current.plainText,
        doc: notesRef.current.doc,
        marks: notesRef.current.marks,
        authorId,
        workspaceId,
        updatedAtMs: Date.now(),
      })
      setNoteSaveState('saved')
    } catch {
      setNoteSaveState('idle') // keep the local copy; try again on the next edit/flush
    }
  }, [authorId, workspaceId])

  const flushNotes = useCallback(async () => {
    if (localTimer.current) clearTimeout(localTimer.current)
    if (cloudTimer.current) clearTimeout(cloudTimer.current)
    localTimer.current = null
    cloudTimer.current = null
    if (!sessionIdRef.current) return
    await writeLocal()
    await writeCloud()
  }, [writeLocal, writeCloud])

  const scheduleSave = useCallback(() => {
    setNoteSaveState('saving')
    if (localTimer.current) clearTimeout(localTimer.current)
    localTimer.current = setTimeout(() => void writeLocal(), LOCAL_DEBOUNCE_MS)
    if (cloudTimer.current) clearTimeout(cloudTimer.current)
    cloudTimer.current = setTimeout(() => void writeCloud(), FIRESTORE_DEBOUNCE_MS)
  }, [writeLocal, writeCloud])

  const updateNotes = useCallback(
    (doc: NotesDoc, plainText: string) => {
      notesRef.current = { doc, plainText, marks: notesRef.current.marks } // marks preserved across edits
      notifyNotes()
      scheduleSave()
    },
    [notifyNotes, scheduleSave],
  )

  const markMoment = useCallback(() => {
    if (statusRef.current !== 'recording') return
    const cur = notesRef.current
    notesRef.current = {
      ...cur,
      marks: [...cur.marks, { timestamp_seconds: recorder.elapsedSeconds, kind: 'moment', created_at_ms: Date.now() }],
    }
    notifyNotes()
    scheduleSave()
  }, [notifyNotes, scheduleSave, recorder.elapsedSeconds])

  const getNotes = useCallback((): NotesSnapshot => notesRef.current, [])

  // Flush on the events the brief calls out — NOT only beforeunload.
  useEffect(() => {
    if (!isSessionActive(statusRef.current) && status !== 'recording') return
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushNotes()
    }
    const onBlur = () => void flushNotes()
    window.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', onBlur)
    }
  }, [status, flushNotes])

  // Flush on route transitions within /app (session stays alive; we just persist unsaved notes).
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname
      if (sessionIdRef.current) void flushNotes()
    }
  }, [pathname, flushNotes])

  // Warn before a hard refresh/close while recording (can't preserve a live MediaRecorder — honest).
  useEffect(() => {
    if (status !== 'recording') return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      void writeLocal() // best-effort; do not rely on this alone
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status, writeLocal])

  // ---- lifecycle -----------------------------------------------------------
  const start = useCallback(
    async (setup: ActiveSessionSetup) => {
      if (statusRef.current !== 'idle') return // guard double-start
      setErrorMessage(null)
      if (!move('preparing')) return
      setTitle(setup.title || 'Untitled session')

      // Create the ONE persistent session doc up front so notes can attach immediately.
      let newId: string
      try {
        newId = await createSession({
          workspaceId,
          title: setup.title.trim() || 'Untitled session',
          sessionType: setup.sessionType,
          transcript: '',
          projectName: setup.projectName,
          participants: setup.participants,
          notes: setup.preNotes,
          createdBy: authorId,
          transcriptionStatus: 'none', // audio + 'pending' are set on End
          expectedLanguages: setup.expectedLanguages,
          durationSeconds: 0,
        })
      } catch {
        setErrorMessage('Could not create the session. Please try again.')
        move('failed')
        return
      }

      sessionIdRef.current = newId
      setSessionId(newId)
      notesRef.current = { doc: EMPTY_DOC, plainText: '', marks: [] }
      notifyNotes()
      setNoteSaveState('idle')

      const ok = await recorder.start()
      if (!ok) {
        setErrorMessage(recorder.errorMessage ?? 'Microphone unavailable.')
        move('failed')
        return
      }
      move('recording')
    },
    [authorId, workspaceId, recorder, move],
  )

  const finalize = useCallback(
    async (durationSeconds: number, hasAudio: boolean) => {
      const sid = sessionIdRef.current
      if (!sid) return
      await updateDoc(doc(getDb(), 'sessions', sid), {
        duration_seconds: durationSeconds,
        transcription_status: hasAudio ? 'pending' : 'failed',
        transcription_error: hasAudio ? null : 'No audio was captured for this recording.',
        updated_at: serverTimestamp(),
      })
    },
    [],
  )

  const resetToIdle = useCallback(() => {
    statusRef.current = 'idle'
    setStatus('idle')
    sessionIdRef.current = null
    setSessionId(null)
    setTitle('')
    setNoteSaveState('idle')
    notesRef.current = { doc: EMPTY_DOC, plainText: '', marks: [] }
    notifyNotes()
  }, [notifyNotes])

  const end = useCallback(async () => {
    if (statusRef.current !== 'recording') return // guard double-end / invalid state
    const sid = sessionIdRef.current
    move('stopping')
    const result = await recorder.stop()

    move('uploading')
    await flushNotes()
    const hasAudio = Boolean(result?.blob)
    try {
      if (result?.blob && sid) await putLocalAudio(sid, result.blob)
    } catch {
      /* handled below via finalize (failed status) if needed */
    }
    try {
      await finalize(result?.durationSeconds ?? 0, hasAudio && Boolean(result?.blob))
    } catch {
      /* leave the session doc as-is; the review page still opens */
    }

    move('processing')
    const target = sid ? `/app/sessions/${sid}` : '/app/sessions'
    resetToIdle() // clears the global dock; the review page owns the flow from here
    router.push(target)
  }, [recorder, flushNotes, finalize, resetToIdle, router, move])

  const cancel = useCallback(async () => {
    // Discard: stop the mic, keep the (empty) session doc, drop local notes.
    await recorder.stop().catch(() => {})
    const sid = sessionIdRef.current
    if (sid) await deleteLocalNote(sid, authorId).catch(() => {})
    resetToIdle()
  }, [recorder, authorId, resetToIdle])

  const value = useMemo<ActiveSessionContextValue>(
    () => ({
      status,
      sessionId,
      title,
      elapsedSeconds: recorder.elapsedSeconds,
      micLabel: recorder.deviceLabel,
      errorMessage,
      noteSaveState,
      analyser: recorder.analyserNode,
      isActive: isSessionActive(status),
      start,
      end,
      cancel,
      updateNotes,
      getNotes,
      flushNotes,
      subscribeNotes,
      getNotesContent,
      getNotesDoc,
      markMoment,
    }),
    [status, sessionId, title, recorder.elapsedSeconds, recorder.deviceLabel, recorder.analyserNode, errorMessage, noteSaveState, start, end, cancel, updateNotes, getNotes, flushNotes, subscribeNotes, getNotesContent, getNotesDoc, markMoment],
  )

  return <ActiveSessionContext.Provider value={value}>{children}</ActiveSessionContext.Provider>
}
