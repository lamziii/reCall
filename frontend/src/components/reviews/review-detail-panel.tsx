import { useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { ReviewStatus } from '@/components/recall/review-status'
import { DecisionList } from '@/components/sessions/decision-list'
import { SessionTaskList } from '@/components/sessions/session-task-list'
import { QuestionList } from '@/components/recall/question-list'
import { Divider } from '@/components/data-display/divider'
import { Skeleton } from '@/components/feedback/skeleton'
import { Body, Caption, Label } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import { useReviewDetailData } from '@/data/reviews/use-review-detail-data'

export interface ReviewDetailPanelProps {
  sessionId: string | null
  onOpenChange: (open: boolean) => void
  onStatusChange: (sessionId: string) => void
}

export function ReviewDetailPanel({ sessionId, onOpenChange, onStatusChange }: ReviewDetailPanelProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, changeStatus } = useReviewDetailData(sessionId)

  function approve() {
    changeStatus('approved')
    toast({ title: 'Review approved', variant: 'success' })
    if (sessionId) onStatusChange(sessionId)
  }

  function needsEdits() {
    changeStatus('needs-edits')
    toast({ title: 'Marked as needs edits' })
    if (sessionId) onStatusChange(sessionId)
  }

  return (
    <Sheet open={Boolean(sessionId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-label="Review details" className="w-full max-w-lg overflow-y-auto">
        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : state.status === 'success' ? (
          <div className="flex flex-col gap-6">
            <SheetHeader>
              <SheetTitle>{state.data.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-3">
              <ReviewStatus status={state.data.status} />
              <ConfidenceIndicator value={state.data.confidence} variant="detailed" />
              <Caption className="text-subtle-foreground">{state.data.dateLabel}</Caption>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/app/sessions/${state.data.sessionId}`)}
              className="focus-ring flex w-fit items-center gap-2 rounded-md text-left text-small text-foreground transition-fast hover:text-accent"
            >
              <Mic className="size-4 shrink-0 text-subtle-foreground" />
              Open full session
            </button>

            <Divider />

            <div className="flex flex-col gap-1.5">
              <Label as="span">Summary</Label>
              <Body className="text-foreground">{state.data.summary || 'No summary was generated for this session.'}</Body>
            </div>

            <Divider />

            <div className="flex flex-col gap-2.5">
              <Label as="span">Decisions</Label>
              <DecisionList decisions={state.data.decisions} onApprove={() => {}} onReject={() => {}} />
            </div>

            <Divider />

            <div className="flex flex-col gap-2.5">
              <Label as="span">Tasks</Label>
              <SessionTaskList tasks={state.data.tasks} onStatusChange={() => {}} />
            </div>

            <Divider />

            <div className="flex flex-col gap-2.5">
              <Label as="span">Open questions</Label>
              <QuestionList questions={state.data.questions} />
            </div>

            <Divider />

            <div className="flex items-center gap-2">
              <Button onClick={approve} disabled={state.data.status === 'approved'}>
                Approve
              </Button>
              <Button variant="secondary" onClick={needsEdits} disabled={state.data.status === 'needs-edits'}>
                Needs edits
              </Button>
            </div>
          </div>
        ) : (
          <Body className="text-muted-foreground">This review couldn't be found.</Body>
        )}
      </SheetContent>
    </Sheet>
  )
}
