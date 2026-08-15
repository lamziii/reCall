import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export interface DemoTimelineOptions {
  /** Length of one play-through in ms (the last cue should fire before this). */
  duration: number
  /** Replay from 0 after `duration` + `hold`. Default true. */
  loop?: boolean
  /** How long to hold the finished frame before looping, ms. Default 1800. */
  hold?: number
  /** Clock granularity, ms. 120 keeps the recording timer/waveform smooth while re-rendering
   *  only the small demo subtree ~8×/s. */
  tickMs?: number
  /** Viewport visibility required to start the clock. Default 0.5 (spec: 40–60%). */
  threshold?: number
}

export interface DemoTimeline {
  /** Attach to the demo's outermost element — the clock only runs while it's on screen. */
  ref: React.RefObject<HTMLDivElement | null>
  /** ms since this play-through began, clamped to `duration`. `Infinity` under reduced-motion so
   *  every cue reads as already fired (the demo shows its final, complete state). */
  elapsed: number
  /** True under prefers-reduced-motion — render statically, no cursor/typing. */
  reduced: boolean
  /** True while the clock is running (on screen, motion allowed). */
  running: boolean
}

/**
 * The one demo-sequencing primitive the marketing product demos share. A single interval — gated by
 * an IntersectionObserver so it costs nothing off-screen — advances `elapsed`; components derive
 * their visible state from cue thresholds (`elapsed >= cue.at`). No overlapping timers, cleaned up on
 * unmount, and fully bypassed under reduced-motion. Isolated, local state only — never touches real
 * app data.
 */
export function useDemoTimeline(opts: DemoTimelineOptions): DemoTimeline {
  const { duration, loop = true, hold = 1800, tickMs = 120, threshold = 0.5 } = opts
  const reduced = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement | null>(null)
  const [elapsed, setElapsed] = useState(reduced ? Infinity : 0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (reduced) {
      setElapsed(Infinity)
      return
    }
    const el = ref.current
    if (!el) return

    const total = duration + hold
    let intervalId: number | undefined
    let startAt = 0

    const stop = () => {
      if (intervalId != null) {
        clearInterval(intervalId)
        intervalId = undefined
      }
      setRunning(false)
    }
    const start = () => {
      if (intervalId != null) return
      startAt = performance.now()
      setElapsed(0)
      setRunning(true)
      intervalId = window.setInterval(() => {
        const e = performance.now() - startAt
        if (e >= total) {
          if (loop) {
            startAt = performance.now()
            setElapsed(0)
          } else {
            setElapsed(duration)
            stop()
          }
          return
        }
        // Clamp to `duration` so the final frame holds steady during `hold`.
        setElapsed(e > duration ? duration : e)
      }, tickMs)
    }

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
  }, [reduced, duration, loop, hold, tickMs, threshold])

  return { ref, elapsed, reduced, running }
}
