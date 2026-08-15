import type { ReactNode } from 'react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { EmptyState } from '@/components/feedback/empty-state'

export interface EmptyRoutePageProps {
  title: string
  description: string
  emptyIcon: ReactNode
  emptyTitle: string
  emptyDescription: string
  action?: ReactNode
}

/** Every /app route is this same shape today: title, subtitle, centered empty state. Real content replaces the empty state later — the title/description/layout stay. */
export function EmptyRoutePage({ title, description, emptyIcon, emptyTitle, emptyDescription, action }: EmptyRoutePageProps) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={action} />
      </div>
    </PageContainer>
  )
}
