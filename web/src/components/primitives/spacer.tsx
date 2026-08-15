import { cn } from '@/lib/utils'

const SIZE = {
  4: 'h-1 w-1',
  8: 'h-2 w-2',
  12: 'h-3 w-3',
  16: 'h-4 w-4',
  24: 'h-6 w-6',
  32: 'h-8 w-8',
  48: 'h-12 w-12',
  64: 'h-16 w-16',
  96: 'h-24 w-24',
} as const

export interface SpacerProps {
  size?: keyof typeof SIZE
  axis?: 'horizontal' | 'vertical'
  grow?: boolean
  className?: string
}

/** Fixed gap from the spacing scale, or a flex-grow pusher when `grow` is set. Prefer Stack's `gap` prop over Spacer inside a flex row/column. */
export function Spacer({ size = 16, axis = 'vertical', grow, className }: SpacerProps) {
  if (grow) {
    return <div aria-hidden className={cn('flex-1', className)} />
  }

  return (
    <div
      aria-hidden
      className={cn(axis === 'vertical' ? 'w-full' : 'h-full', SIZE[size], className)}
    />
  )
}
