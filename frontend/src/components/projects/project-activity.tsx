import { CheckSquare, FileText, GitBranch } from 'lucide-react'
import { Timeline, TimelineItem } from '@/components/data-display/timeline'
import { EmptyState } from '@/components/feedback/empty-state'
import type { ProjectTimelineItem } from '@/data/projects/types'

const ICON = {
  session: FileText,
  decision: GitBranch,
  task: CheckSquare,
}

export function ProjectActivity({ timeline }: { timeline: ProjectTimelineItem[] }) {
  if (timeline.length === 0) {
    return <EmptyState title="No activity yet" description="Sessions, decisions, and tasks for this project will show up here." className="py-12" />
  }

  return (
    <Timeline>
      {timeline.map((item, index) => {
        const Icon = ICON[item.kind]
        return (
          <TimelineItem
            key={item.id}
            time={item.timestampLabel}
            title={item.label}
            description={item.detail}
            icon={<Icon />}
            isLast={index === timeline.length - 1}
          />
        )
      })}
    </Timeline>
  )
}
