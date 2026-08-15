import type { ComponentProps } from 'react'
import { Stack } from '@/components/layout/stack'

export type InlineProps = Omit<ComponentProps<typeof Stack>, 'direction'>

/** Stack pinned to row direction — the common case, named for readability at call sites. */
export function Inline({ wrap = true, ...props }: InlineProps) {
  return <Stack direction="row" wrap={wrap} {...props} />
}
