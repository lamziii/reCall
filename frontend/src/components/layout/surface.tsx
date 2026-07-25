import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const surfaceVariants = cva('rounded-xl', {
  variants: {
    level: {
      base: 'bg-bg',
      surface: 'bg-surface',
      raised: 'bg-surface-raised',
      overlay: 'bg-surface-overlay',
    },
    border: {
      true: 'border border-border',
      false: '',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    },
  },
  defaultVariants: { level: 'surface', border: true, padding: 'none' },
})

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof surfaceVariants> {}

/** Elevation primitive. Card (data-display) is a Surface with header/content/footer conventions layered on top. */
export function Surface({ level, border, padding, className, ...props }: SurfaceProps) {
  return <div className={cn(surfaceVariants({ level, border, padding }), className)} {...props} />
}
