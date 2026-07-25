import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function CalendarPage() {
  return (
    <EmptyRoutePage
      title="Calendar"
      description="Upcoming and past sessions at a glance."
      emptyIcon={<Calendar />}
      emptyTitle="Nothing scheduled"
      emptyDescription="Connect a calendar to see upcoming sessions here."
      action={<Button>Connect calendar</Button>}
    />
  )
}
