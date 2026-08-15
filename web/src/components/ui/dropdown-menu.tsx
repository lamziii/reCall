import { useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import type { Placement } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface DropdownMenuProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu({ children, ...props }: DropdownMenuProps) {
  return <Popover {...props}>{children}</Popover>
}

export function DropdownMenuTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  return <PopoverTrigger>{children}</PopoverTrigger>
}

export interface DropdownMenuContentProps {
  children: ReactNode
  placement?: Placement
  className?: string
  width?: number
}

/** role="menu" list with roving arrow-key focus across role="menuitem" children. */
export function DropdownMenuContent({ children, placement = 'bottom-start', className, width = 200 }: DropdownMenuContentProps) {
  const listRef = useRef<HTMLDivElement>(null)

  function onKeyDown(event: React.KeyboardEvent) {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([data-disabled])') ?? [])
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(currentIndex + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(currentIndex - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  return (
    <PopoverContent placement={placement} width={width} className="p-1">
      <div ref={listRef} role="menu" onKeyDown={onKeyDown} className={cn('flex flex-col gap-0.5', className)}>
        {children}
      </div>
    </PopoverContent>
  )
}

export interface DropdownMenuItemProps {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
  danger?: boolean
  icon?: ReactNode
  shortcut?: string
}

export function DropdownMenuItem({ children, onSelect, disabled, danger, icon, shortcut }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      data-disabled={disabled ? '' : undefined}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-small text-foreground outline-none',
        'transition-fast hover:bg-surface-hover focus-visible:bg-surface-hover',
        disabled && 'pointer-events-none opacity-40',
        danger && 'text-danger hover:bg-danger-muted focus-visible:bg-danger-muted',
      )}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className="shrink-0 text-caption text-subtle-foreground">{shortcut}</span>}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border-subtle" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 py-1.5 text-caption font-medium uppercase tracking-wide text-subtle-foreground">{children}</div>
}
