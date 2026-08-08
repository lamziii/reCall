import { RecallAiIcon } from './recall-ai-icon'
import type { EntityType } from '@/lib/ai/types'

const SUGGESTIONS: Record<'session' | 'project' | 'default', string[]> = {
  session: ['Summarize this meeting', 'What decisions were made?', 'What tasks came out of this?', "What's still unresolved?"],
  project: ["What's blocking this project?", 'Show recent decisions', 'Which tasks are overdue?', 'What changed recently?'],
  default: ['What did I commit to this week?', 'What decisions need review?', 'What am I waiting on?', 'Summarize my last meeting'],
}

export function RecallAiEmptyState({ entityType, onPick }: { entityType: EntityType | null; onPick: (text: string) => void }) {
  const key = entityType === 'session' ? 'session' : entityType === 'project' ? 'project' : 'default'
  const suggestions = SUGGESTIONS[key]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-surface text-foreground">
          <RecallAiIcon className="size-[22px]" />
        </span>
        <h2 className="text-h3 font-semibold tracking-tight text-foreground">What can I help with?</h2>
        <p className="max-w-[36ch] text-small text-muted-foreground">
          Ask about your meetings, decisions, tasks and projects.
        </p>
      </div>

      <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="focus-ring rounded-full border border-border bg-surface px-3.5 py-2 text-small text-foreground transition-fast hover:border-border-strong hover:bg-surface-hover active:scale-[0.98]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
