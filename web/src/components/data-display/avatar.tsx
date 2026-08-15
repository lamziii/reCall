import { forwardRef, isValidElement, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-active font-medium text-foreground ring-2 ring-bg select-none',
  {
    variants: {
      size: {
        xs: 'size-5 text-[9px]',
        sm: 'size-6 text-[10px]',
        md: 'size-8 text-caption',
        lg: 'size-10 text-small',
        xl: 'size-14 text-title',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: { size: 'md', shape: 'circle' },
  },
)

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string
  name: string
  className?: string
  status?: 'online' | 'offline' | 'away'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

const STATUS_COLOR = {
  online: 'bg-success',
  offline: 'bg-subtle-foreground',
  away: 'bg-warning',
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(({ src, name, size, shape, className, status }, ref) => {
  const [errored, setErrored] = useState(false)

  return (
    <span ref={ref} className={cn(avatarVariants({ size, shape }), className)}>
      {src && !errored ? (
        <img src={src} alt={name} onError={() => setErrored(true)} className="size-full object-cover" />
      ) : (
        getInitials(name)
      )}
      {status && (
        <span
          className={cn('absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-bg', STATUS_COLOR[status])}
          aria-label={status}
        />
      )}
    </span>
  )
})
Avatar.displayName = 'Avatar'

export interface AvatarGroupProps {
  children: ReactNode
  max?: number
  spacing?: 'compact' | 'normal'
  showTooltips?: boolean
}

export function AvatarGroup({ children, max = 4, spacing = 'normal', showTooltips = true }: AvatarGroupProps) {
  const items = Array.isArray(children) ? children : [children]
  const visible = items.slice(0, max)
  const overflow = items.length - visible.length

  return (
    <div className={cn('flex', spacing === 'compact' ? '-space-x-3' : '-space-x-2')}>
      {visible.map((child, index) => {
        if (!showTooltips || !isValidElement(child)) return child
        const element = child as ReactElement<AvatarProps & Record<string, unknown>>
        const name = element.props.name
        return name ? (
          <Tooltip key={index} content={name}>
            {element}
          </Tooltip>
        ) : (
          child
        )
      })}
      {overflow > 0 && (
        <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-active text-caption font-medium text-muted-foreground ring-2 ring-bg">
          +{overflow}
        </span>
      )}
    </div>
  )
}
