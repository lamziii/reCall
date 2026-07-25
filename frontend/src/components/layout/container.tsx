import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
  variants: {
    width: {
      content: 'max-w-[var(--container-content)]',
      page: 'max-w-[var(--container-page)]',
      wide: 'max-w-[var(--container-wide)]',
      full: 'max-w-none',
    },
  },
  defaultVariants: { width: 'page' },
})

export interface ContainerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {}

export function Container({ width, className, ...props }: ContainerProps) {
  return <div className={cn(containerVariants({ width }), className)} {...props} />
}
