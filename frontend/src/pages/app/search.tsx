import { Search } from 'lucide-react'
import { EmptyRoutePage } from './empty-route-page'

export function SearchPage() {
  return (
    <EmptyRoutePage
      title="Search"
      description="Find anything across your workspace."
      emptyIcon={<Search />}
      emptyTitle="Search Recall"
      emptyDescription="Look up sessions, projects, tasks, and people — or press ⌘K from anywhere."
    />
  )
}
