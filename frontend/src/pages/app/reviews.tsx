import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function ReviewsPage() {
  return (
    <EmptyRoutePage
      title="Reviews"
      description="Structured feedback and retros."
      emptyIcon={<ClipboardCheck />}
      emptyTitle="No reviews yet"
      emptyDescription="Reviews created from your sessions will appear here."
      action={<Button>New review</Button>}
    />
  )
}
