import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InlineError({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('flex items-center gap-1.5 text-small text-danger', className)}>
      <AlertCircle className="size-3.5 shrink-0" />
      {children}
    </p>
  )
}
