import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

const BAR_COUNT = 28

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null
  active: boolean
  className?: string
}

/**
 * Reads the analyser directly in a rAF loop and mutates bar heights via refs — avoids
 * pushing 60fps updates through React state, which would repaint the whole tree every frame.
 */
export function AudioVisualizer({ analyser, active, className }: AudioVisualizerProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    if (!active || !analyser) {
      barRefs.current.forEach((bar) => bar?.style.setProperty('--level', '0.08'))
      return
    }

    const data = new Uint8Array(analyser.frequencyBinCount)
    let frameId: number

    function tick() {
      analyser!.getByteFrequencyData(data)
      const step = Math.floor(data.length / BAR_COUNT) || 1
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = data[i * step] ?? 0
        const level = Math.max(0.08, value / 255)
        barRefs.current[i]?.style.setProperty('--level', level.toFixed(2))
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [analyser, active, reduceMotion])

  return (
    <div
      aria-hidden="true"
      className={cn('flex h-16 items-end justify-center gap-1', className)}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el
          }}
          className="w-1 rounded-full bg-accent transition-[transform] duration-75 ease-out"
          style={{ height: '100%', transform: `scaleY(var(--level, ${reduceMotion ? 0.2 : 0.08}))`, transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  )
}
