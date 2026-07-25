import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
      12: 'gap-12',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: {
      true: 'flex-wrap',
      false: '',
    },
  },
  defaultVariants: { direction: 'column', gap: 4 },
})

export interface StackProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof stackVariants> {}

/** Flex layout primitive — the default building block for arranging elements with rhythm from the 8px spacing scale. */
export function Stack({ direction, gap, align, justify, wrap, className, ...props }: StackProps) {
  return <div className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)} {...props} />
}
