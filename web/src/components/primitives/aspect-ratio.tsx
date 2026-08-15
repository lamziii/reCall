import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: number
}

/** Native CSS aspect-ratio — for media/preview placeholders. No padding-hack needed. */
export function AspectRatio({ ratio = 16 / 9, style, className, children, ...props }: AspectRatioProps) {
  return (
    <div style={{ aspectRatio: ratio, ...style }} className={cn('overflow-hidden', className)} {...props}>
      {children}
    </div>
  )
}
