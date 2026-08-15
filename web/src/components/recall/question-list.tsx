import { EmptyState } from '@/components/feedback/empty-state'
import { Caption, Small } from '@/components/typography'
import type { SessionQuestionItem } from '@/data/sessions/types'

export function QuestionList({ questions }: { questions: SessionQuestionItem[] }) {
  if (questions.length === 0) {
    return <EmptyState title="No open questions" className="py-6" />
  }

  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-1 py-3">
          <Small className="font-medium text-foreground">{q.title}</Small>
          <Caption className="text-subtle-foreground">{[q.ownerName, q.projectName, q.timestampLabel].filter(Boolean).join(' · ')}</Caption>
        </div>
      ))}
    </div>
  )
}
