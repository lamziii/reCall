import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Native overflow scrolling with the app's thin-scrollbar styling (see styles/tokens/index.css). No JS scrollbar library needed. */
export function ScrollArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('overflow-auto', className)} {...props} />
}
