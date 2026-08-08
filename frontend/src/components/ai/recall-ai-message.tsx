import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecallAiMarkdown } from './recall-ai-markdown'
import { RecallAiSources } from './recall-ai-sources'
import type { ChatMessage } from '@/lib/ai/types'

/** Three restrained dots shown before the first token arrives. */
function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-1" role="status" aria-label="Recall AI is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-pulse rounded-full bg-subtle-foreground"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: '1s' }}
        />
      ))}
    </span>
  )
}

export function RecallAiMessage({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl bg-surface-active px-4 py-2.5 text-body leading-relaxed text-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  const empty = message.content.trim().length === 0
  return (
    <div className={cn('flex flex-col')}>
      {empty && !message.error ? (
        <ThinkingDots />
      ) : (
        <>
          {!empty && <RecallAiMarkdown content={message.content} />}
          {message.sources && !message.error && <RecallAiSources entities={message.sources} answer={message.content} />}
        </>
      )}

      {message.error && (
        <div className="mt-1 flex flex-col items-start gap-2">
          <p className="text-small text-muted-foreground">{message.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-small text-foreground transition-fast hover:bg-surface-hover"
          >
            <RotateCw className="size-3.5" />
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
