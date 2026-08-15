import { Tooltip } from '@/components/ui/tooltip'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RecallAiIcon } from './recall-ai-icon'

/**
 * Top-right toolbar button that opens Recall AI. Matches the ghost IconButton dimensions of the
 * bell / theme / profile buttons; when the panel is open it takes the subtle selected treatment.
 * (Built as its own button rather than IconButton so the composed icon's sparkle keeps its size.)
 */
export function RecallAiTrigger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <Tooltip content="Recall AI">
      <button
        type="button"
        aria-label="Open Recall AI"
        aria-pressed={open}
        onClick={onClick}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-md' }),
          open && 'bg-surface-active text-foreground',
        )}
      >
        <RecallAiIcon />
      </button>
    </Tooltip>
  )
}
