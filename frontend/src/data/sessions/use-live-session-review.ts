import { useEffect, useState } from 'react'
import { subscribeReview, subscribeSession, subscribeTasksForSession } from '@/data/live/live-store'
import type { LiveSessionDoc, LiveTaskDoc, SessionReviewDoc } from '@/data/live/types'

export type LiveReviewStatus = 'loading' | 'not-found' | 'error' | 'ready'

export interface LiveReviewData {
  status: LiveReviewStatus
  session: LiveSessionDoc | null
  review: SessionReviewDoc | null
  /** candidate indices already promoted to the board (for the "Added" state / dedupe). */
  promotedIndices: Set<number>
}

/**
 * Subscribes to the live session, its review doc, and the board tasks sourced from it.
 * Realtime — when extractSessionReview finishes, the review snapshot updates the page with no
 * manual refresh.
 */
export function useLiveSessionReview(sessionId: string | undefined): LiveReviewData {
  const [session, setSession] = useState<LiveSessionDoc | null>(null)
  const [review, setReview] = useState<SessionReviewDoc | null>(null)
  const [promoted, setPromoted] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<LiveReviewStatus>('loading')

  useEffect(() => {
    if (!sessionId) {
      setStatus('not-found')
      return
    }
    setStatus('loading')

    const unsubSession = subscribeSession(
      sessionId,
      (s) => {
        setSession(s)
        setStatus(s ? 'ready' : 'not-found')
      },
      () => setStatus('error'),
    )
    const unsubReview = subscribeReview(sessionId, setReview, () => {})
    const unsubTasks = subscribeTasksForSession(
      sessionId,
      (tasks: LiveTaskDoc[]) => {
        const set = new Set<number>()
        tasks.forEach((t) => {
          if (typeof t.source_candidate_index === 'number') set.add(t.source_candidate_index)
        })
        setPromoted(set)
      },
      () => {},
    )

    return () => {
      unsubSession()
      unsubReview()
      unsubTasks()
    }
  }, [sessionId])

  return { status, session, review, promotedIndices: promoted }
}
