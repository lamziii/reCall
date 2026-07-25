import { forwardRef } from 'react'
import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BoxProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
}

/** The floor primitive — a styleless polymorphic element. Reach for Stack/Grid/Surface first; Box is the escape hatch. */
export const Box = forwardRef<HTMLElement, BoxProps>(({ as: Tag = 'div', className, ...props }, ref) => {
  return <Tag ref={ref} className={cn(className)} {...props} />
})
Box.displayName = 'Box'
