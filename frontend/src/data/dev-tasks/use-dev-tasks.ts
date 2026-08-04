import { useCallback, useEffect, useState } from 'react'
import { ensureDevTasksSeeded, subscribeDevTasks } from './dev-tasks-store'
import type { DevelopmentTask } from './types'

export type DevTasksState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; tasks: DevelopmentTask[] }

/**
 * Realtime subscription to the shared development task board, plus a one-time idempotent seed. Both
 * developers see each other's changes live via `onSnapshot`. Seeding runs once (guarded by the meta
 * doc); a seed failure is non-fatal — the subscription still drives the board.
 */
export function useDevTasks() {
  const [state, setState] = useState<DevTasksState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    // Fire-and-forget seed; the snapshot below reflects the seeded tasks when it lands.
    void ensureDevTasksSeeded().catch((err) => console.warn('dev-tasks seed skipped:', err))

    const unsub = subscribeDevTasks(
      (tasks) => {
        if (!cancelled) setState({ status: 'ready', tasks })
      },
      (err) => {
        console.error('dev-tasks subscription failed:', err)
        if (!cancelled) setState({ status: 'error' })
      },
    )
    return () => {
      cancelled = true
      unsub()
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }, [])
  return { state, retry }
}
