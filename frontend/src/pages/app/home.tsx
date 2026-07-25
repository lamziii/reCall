import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function AppHomePage() {
  return (
    <EmptyRoutePage
      title="Home"
      description="An overview of your workspace."
      emptyIcon={<Home />}
      emptyTitle="Nothing to show yet"
      emptyDescription="Once you start recording sessions and creating projects, your overview will appear here."
      action={<Button>Record a session</Button>}
    />
  )
}
