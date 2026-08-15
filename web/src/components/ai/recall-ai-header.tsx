import { Maximize2, SquarePen, X } from 'lucide-react'
import { IconButton } from '@/components/ui/button'
import { RecallAiIcon } from './recall-ai-icon'

export function RecallAiHeader({
  contextLabel,
  onNewChat,
  onExpand,
  onClose,
}: {
  contextLabel: string
  onNewChat: () => void
  onExpand?: () => void
  onClose: () => void
}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
          <RecallAiIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-small font-semibold leading-tight text-foreground">Recall AI</p>
          <p className="truncate text-caption leading-tight text-subtle-foreground">{contextLabel}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton icon={<SquarePen />} label="New chat" variant="ghost" size="sm" onClick={onNewChat} />
        {onExpand && <IconButton icon={<Maximize2 />} label="Open full assistant" variant="ghost" size="sm" onClick={onExpand} />}
        <IconButton icon={<X />} label="Close Recall AI" variant="ghost" size="sm" onClick={onClose} />
      </div>
    </header>
  )
}
