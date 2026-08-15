'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Reusable microphone waveform. Reads real amplitude from an AnalyserNode in a requestAnimationFrame
 * loop and writes bar heights via refs/CSS vars — high-frequency data NEVER goes through React state
 * or app-wide context (the brief's separation requirement). Monochrome, center-aligned, calm at
 * silence; no gradients/glow/fake motion.
 *
 * Amplitude is smoothed frame-to-frame (lerp) so bars breathe rather than flicker, and it's derived
 * from the mic (getByteFrequencyData), not randomness.
 */
export interface VoiceWaveformProps {
  analyser: AnalyserNode | null
  active: boolean
  barCount?: number // 20–36; default 28
  className?: string
}

const IDLE_LEVEL = 0.06
const ATTACK = 0.5 // rise smoothing toward the target
const RELEASE = 0.16 // fall smoothing (slower → calmer decay)

export function VoiceWaveform({ analyser, active, barCount = 28, className }: VoiceWaveformProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const levelsRef = useRef<number[]>(Array.from({ length: barCount }, () => IDLE_LEVEL))
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    // Reduced motion: hold a static, calm midline — honest, no animation.
    if (reduceMotion) {
      barRefs.current.forEach((bar) => bar?.style.setProperty('--level', '0.18'))
      return
    }

    let frameId = 0
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null

    function tick() {
      const levels = levelsRef.current
      const settleTargets = active && analyser && data
      if (settleTargets) {
        analyser.getByteFrequencyData(data)
        const step = Math.floor(data.length / barCount) || 1
        for (let i = 0; i < barCount; i++) {
          // Mirror bins around the center so the shape is symmetric like an iOS mic meter.
          const mirrored = i < barCount / 2 ? i : barCount - 1 - i
          const raw = (data[mirrored * step] ?? 0) / 255
          const target = Math.max(IDLE_LEVEL, raw)
          const smoothing = target > levels[i] ? ATTACK : RELEASE
          levels[i] += (target - levels[i]) * smoothing
          barRefs.current[i]?.style.setProperty('--level', levels[i].toFixed(3))
        }
      } else {
        // Ease everything back down to the idle line.
        for (let i = 0; i < barCount; i++) {
          levels[i] += (IDLE_LEVEL - levels[i]) * RELEASE
          barRefs.current[i]?.style.setProperty('--level', levels[i].toFixed(3))
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [analyser, active, barCount, reduceMotion])

  return (
    <div aria-hidden className={cn('flex h-7 items-center justify-center gap-[3px]', className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el
          }}
          className="w-[3px] rounded-full bg-foreground/70"
          style={{
            height: '100%',
            transform: `scaleY(var(--level, ${IDLE_LEVEL}))`,
            transformOrigin: 'center', // grow symmetrically from the centerline
          }}
        />
      ))}
    </div>
  )
}
