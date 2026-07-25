import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  attached?: boolean
  wrap?: boolean
}

/** Groups Buttons/IconButtons. `attached` fuses adjacent borders into one segmented control; otherwise buttons are evenly spaced. */
export function ButtonGroup({ orientation = 'horizontal', attached = false, wrap = false, className, children, ...props }: ButtonGroupProps) {
  const isRow = orientation === 'horizontal'

  return (
    <div
      role="group"
      className={cn(
        'flex',
        isRow ? 'flex-row' : 'flex-col',
        wrap && isRow && 'flex-wrap',
        attached ? 'gap-0' : 'gap-2',
        attached &&
          (isRow
            ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
            : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'),
        attached && '[&>*]:relative [&>*:focus-visible]:z-10',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
