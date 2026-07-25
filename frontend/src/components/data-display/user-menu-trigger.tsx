import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Avatar } from './avatar'
import { cn } from '@/lib/utils'

export interface UserMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  name: string
  avatarSrc?: string
  subtitle?: string
}

/** Compact avatar + name trigger, meant to open a menu (DropdownMenuTrigger). Not the menu itself. */
export const UserMenuTrigger = forwardRef<HTMLButtonElement, UserMenuTriggerProps>(
  ({ name, avatarSrc, subtitle, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'focus-ring flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-fast hover:bg-surface-hover',
          className,
        )}
        {...props}
      >
        <Avatar name={name} src={avatarSrc} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-medium text-foreground">{name}</span>
          {subtitle && <span className="block truncate text-caption text-subtle-foreground">{subtitle}</span>}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" />
      </button>
    )
  },
)
UserMenuTrigger.displayName = 'UserMenuTrigger'
