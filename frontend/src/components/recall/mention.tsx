import type { ReactNode } from 'react'
import { CheckSquare, FileText, FolderKanban, GitBranch, User, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MentionType = 'person' | 'project' | 'task' | 'decision' | 'document' | 'session'

export const MENTION_ICONS: Record<MentionType, typeof User> = {
  person: User,
  project: FolderKanban,
  task: CheckSquare,
  decision: GitBranch,
  document: FileText,
  session: Video,
}

export interface MentionProps {
  type: MentionType
  children: ReactNode
  onClick?: () => void
  className?: string
}

/** Pill-style inline reference — the @-mention look, for text composed inside notes/comments. */
export function Mention({ type, children, onClick, className }: MentionProps) {
  const Icon = MENTION_ICONS[type]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex items-center gap-1 rounded px-1 text-small font-medium text-accent transition-fast hover:bg-accent-muted',
        className,
      )}
    >
      <Icon className="size-3" />
      {children}
    </button>
  )
}
