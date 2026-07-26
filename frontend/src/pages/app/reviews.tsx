import { useMemo, useState } from 'react'
import { ClipboardCheck, Search as SearchIcon } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { SearchInput } from '@/components/forms/search-input'
import { Select } from '@/components/forms/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/data-display/table'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { ReviewStatus } from '@/components/recall/review-status'
import { Caption } from '@/components/typography'
import { useReviewsListData } from '@/data/reviews/use-reviews-list-data'
import { ReviewDetailPanel } from '@/components/reviews/review-detail-panel'
import type { ReviewStatusFilter } from '@/data/reviews/types'

const STATUS_OPTIONS: { value: ReviewStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs-edits', label: 'Needs edits' },
]

export function ReviewsPage() {
  const { state, refetch } = useReviewsListData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReviewStatusFilter>('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const hasActiveFilters = search.trim() !== '' || status !== 'all'

  function clearFilters() {
    setSearch('')
    setStatus('all')
  }

  const filtered = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()
    return state.data.reviews.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (query && !`${r.title} ${r.projectName ?? ''}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [state, search, status])

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Reviews" description="Sessions Recall flagged for a quick human check before they're finalized." />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Reviews" description="Sessions Recall flagged for a quick human check before they're finalized." />
        <ErrorState title="We couldn't load your reviews" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Reviews" description="Sessions Recall flagged for a quick human check before they're finalized." />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={<ClipboardCheck />} title="No reviews yet" description="Sessions that need a human check will show up here." />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reviews"
        description="Sessions Recall flagged for a quick human check before they're finalized."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search reviews..."
              className="w-full sm:w-64"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReviewStatusFilter)}
              options={STATUS_OPTIONS}
              size="sm"
              aria-label="Filter by status"
              className="w-auto min-w-36"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No reviews match your filters"
          description="Try a different search or clear filters to see everything."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
          className="py-16"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Issues found</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((review) => (
              <TableRow key={review.id} className="cursor-pointer" onClick={() => setSelectedSessionId(review.sessionId)}>
                <TableCell className="max-w-64 whitespace-normal font-medium text-foreground">{review.title}</TableCell>
                <TableCell className="text-muted-foreground">{review.projectName ?? '—'}</TableCell>
                <TableCell>
                  <ConfidenceIndicator value={review.confidence} />
                </TableCell>
                <TableCell>
                  <Caption className="text-subtle-foreground">
                    {review.issuesFound} {review.issuesFound === 1 ? 'issue' : 'issues'}
                  </Caption>
                </TableCell>
                <TableCell>
                  <ReviewStatus status={review.status} />
                </TableCell>
                <TableCell>
                  <Caption className="text-subtle-foreground">{review.dateLabel}</Caption>
                </TableCell>
                <TableCell>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSessionId(review.sessionId)
                    }}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ReviewDetailPanel
        sessionId={selectedSessionId}
        onOpenChange={(open) => !open && setSelectedSessionId(null)}
        onStatusChange={refetch}
      />
    </PageContainer>
  )
}
