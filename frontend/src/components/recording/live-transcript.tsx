import { useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { TranscriptSpeaker } from '@/components/recall/transcript-speaker'
import type { FinalizedSegment } from '@/data/recording/recording-types'

function formatOffset(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export interface LiveTranscriptProps {
  segments: FinalizedSegment[]
  interimText: string
  isSupported: boolean
  isListening: boolean
}

export function LiveTranscript({ segments, interimText, isSupported, isListening }: LiveTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !isAtBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [segments, interimText])

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }

  if (!isSupported) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-center">
        <p className="max-w-sm text-small text-muted-foreground">
          Live transcription is not supported in this browser. Recall will transcribe the recording after you stop.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {isListening && (
        <span className="inline-flex w-fit items-center gap-1.5 text-caption font-medium text-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
          Live
        </span>
      )}

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto" aria-live="polite" aria-atomic="false">
        {segments.length === 0 && !interimText ? (
          <EmptyState icon={<Mic />} title="Start speaking" description="Your live transcript will appear here." className="py-16" />
        ) : (
          <div className="flex flex-col gap-1">
            {segments.map((segment) => (
              <TranscriptSpeaker key={segment.id} name="You" timestamp={formatOffset(segment.offsetSeconds)}>
                {segment.text}
              </TranscriptSpeaker>
            ))}
            {interimText && (
              <div className="flex gap-3 rounded-lg p-2">
                <span className="w-8 shrink-0" />
                <p className="text-small italic text-muted-foreground">{interimText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
