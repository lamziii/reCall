import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const gridVariants = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      12: 'grid-cols-12',
    },
    gap: {
      2: 'gap-2',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    },
  },
  defaultVariants: { cols: 3, gap: 6 },
})

export interface GridProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants> {}

export function Grid({ cols, gap, className, ...props }: GridProps) {
  return <div className={cn(gridVariants({ cols, gap }), className)} {...props} />
}
