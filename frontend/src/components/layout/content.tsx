import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Content({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={cn('min-h-0 flex-1 overflow-auto', className)} {...props} />
}
