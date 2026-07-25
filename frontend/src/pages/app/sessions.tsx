import { Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function SessionsPage() {
  return (
    <EmptyRoutePage
      title="Sessions"
      description="Every recorded conversation, all in one place."
      emptyIcon={<Mic />}
      emptyTitle="No sessions yet"
      emptyDescription="Record your first meeting to see it appear here."
      action={<Button>New session</Button>}
    />
  )
}
