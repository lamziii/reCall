import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Secondary split inside Content — e.g. a project's local nav + detail pane. Distinct from AppShell, which is the one root-level shell. */
export function Workspace({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-full min-h-0 divide-x divide-border', className)} {...props} />
}
