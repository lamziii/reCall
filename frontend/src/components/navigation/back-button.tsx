import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BackButtonProps {
  onClick?: () => void
  label?: string
  className?: string
}

export function BackButton({ onClick, label = 'Back', className }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex items-center gap-1.5 rounded-md text-small font-medium text-muted-foreground transition-fast hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  )
}
