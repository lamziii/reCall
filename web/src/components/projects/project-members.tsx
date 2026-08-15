import { Users } from 'lucide-react'
import { List, ListItem } from '@/components/data-display/list'
import { Avatar } from '@/components/data-display/avatar'
import { Badge } from '@/components/data-display/badge'
import { Caption } from '@/components/typography'
import { EmptyState } from '@/components/feedback/empty-state'
import type { ProjectMember } from '@/data/projects/types'

export function ProjectMembers({ members }: { members: ProjectMember[] }) {
  if (members.length === 0) {
    return <EmptyState icon={<Users />} title="No members yet" description="People from this project's sessions will appear here." className="py-12" />
  }

  return (
    <List>
      {members.map((member) => (
        <ListItem
          key={member.name}
          leading={<Avatar name={member.name} size="sm" />}
          trailing={member.isOwner ? <Badge variant="accent">Owner</Badge> : undefined}
          className="py-3"
        >
          <span className="flex flex-col">
            <span className="text-small font-medium text-foreground">{member.name}</span>
            <Caption className="text-subtle-foreground">{member.role}</Caption>
          </span>
        </ListItem>
      ))}
    </List>
  )
}
