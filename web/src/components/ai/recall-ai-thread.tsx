import { useEffect, useRef } from 'react'
import { RecallAiMessage } from './recall-ai-message'
import { RecallAiEmptyState } from './recall-ai-empty-state'
import type { ChatMessage, EntityType, StreamState } from '@/lib/ai/types'

export function RecallAiThread({
  messages,
  state,
  entityType,
  onPick,
  onRetry,
}: {
  messages: ChatMessage[]
  state: StreamState
  entityType: EntityType | null
  onPick: (text: string) => void
  onRetry: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Stick to the bottom as tokens stream — unless the user has scrolled up to read history.
  const stick = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages, state])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      {messages.length === 0 ? (
        <RecallAiEmptyState entityType={entityType} onPick={onPick} />
      ) : (
        <div className="flex flex-col gap-5">
          {messages.map((m) => (
            <RecallAiMessage key={m.id} message={m} onRetry={onRetry} />
          ))}
        </div>
      )}
    </div>
  )
}
