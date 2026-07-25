import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  onBack?: () => void
  details?: string
  className?: string
}

export function ErrorState({ title, description, onRetry, onBack, details, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-full border border-danger/30 bg-danger-muted text-danger [&>svg]:size-5">
        <AlertCircle />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-title font-medium text-foreground">{title}</p>
        {description && <p className="max-w-sm text-small text-muted-foreground">{description}</p>}
      </div>
      {(onBack || onRetry) && (
        <div className="flex gap-2">
          {onBack && (
            <Button variant="secondary" size="sm" onClick={onBack}>
              Go back
            </Button>
          )}
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}
      {details && (
        <Collapsible>
          <CollapsibleTrigger>
            <button type="button" className="focus-ring rounded text-caption text-subtle-foreground underline underline-offset-4 transition-fast hover:text-foreground">
              Technical details
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 max-w-md rounded-md border border-border bg-surface p-3 text-left font-mono text-caption text-muted-foreground">
            {details}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
