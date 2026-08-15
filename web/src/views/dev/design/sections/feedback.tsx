import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { Progress } from '@/components/feedback/progress'
import { Spinner } from '@/components/feedback/spinner'
import { LoadingDots } from '@/components/feedback/loading-dots'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { InlineError } from '@/components/feedback/inline-error'
import { Alert } from '@/components/feedback/alert'
import { useToast } from '@/components/feedback'
import { Button } from '@/components/ui/button'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

function ToastPlayground() {
  const { toast, promise } = useToast()

  function simulateUpload() {
    promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
      loading: 'Uploading recording...',
      success: 'Recording uploaded',
      error: 'Upload failed',
    })
  }

  return (
    <>
      <Button variant="secondary" onClick={() => toast({ title: 'Saved', description: 'Your changes were saved.', variant: 'success' })}>
        Success toast
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: 'Something went wrong', variant: 'danger' })}>
        Error toast
      </Button>
      <Button variant="secondary" onClick={simulateUpload}>
        Promise toast
      </Button>
    </>
  )
}

export function FeedbackSection() {
  const [progress, setProgress] = useState(62)

  return (
    <PlaygroundSection
      id="feedback"
      title="Feedback"
      description="Loading states, inline errors, alerts, and toast — how Recall tells you what just happened, or what's still running."
    >
      <PlaygroundRow label="Interactive: Progress">
        <Progress value={progress} className="w-56" />
        <Button size="sm" variant="secondary" onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 15))}>
          Advance
        </Button>
        <Progress indeterminate className="w-40" />
      </PlaygroundRow>

      <PlaygroundRow label="Spinner">
        <Spinner size="xs" />
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </PlaygroundRow>

      <PlaygroundRow label="LoadingDots">
        <LoadingDots className="text-muted-foreground" />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Skeleton</span>
        <div className="flex max-w-sm flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <PlaygroundRow label="Alert">
        <Alert variant="info" title="Processing" description="This session is still being transcribed." className="max-w-sm" />
        <Alert variant="warning" title="Needs review" description="2 decisions are missing an owner." className="max-w-sm" />
        <Alert
          variant="danger"
          title="Transcription failed"
          description="We couldn't process the audio for this session."
          className="max-w-sm"
          onDismiss={() => {}}
        />
        <Alert variant="success" title="Session ready" className="max-w-sm" />
      </PlaygroundRow>

      <PlaygroundRow label="InlineError">
        <InlineError>Enter a valid email address</InlineError>
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Empty state</span>
        <div className="w-full max-w-md rounded-xl border border-border">
          <EmptyState
            icon={<Inbox />}
            title="No sessions yet"
            description="Recorded sessions will show up here once you start your first one."
            action={<Button size="sm">Start a session</Button>}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Error state</span>
        <div className="w-full max-w-md rounded-xl border border-border">
          <ErrorState
            title="Couldn't load this session"
            description="The transcript service didn't respond in time."
            onRetry={() => {}}
            onBack={() => {}}
            details={'GET /sessions/apollo-launch-kickoff\n504 Gateway Timeout'}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Interactive: Toast (including promise helper)</span>
        <div className="flex flex-wrap gap-3">
          <ToastPlayground />
        </div>
      </div>
    </PlaygroundSection>
  )
}
