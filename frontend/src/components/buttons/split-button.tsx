import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button, IconButton, type ButtonProps } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ButtonGroup } from './button-group'

export interface SplitButtonAction {
  id: string
  label: string
  onSelect: () => void
  icon?: ReactNode
  danger?: boolean
}

export interface SplitButtonProps {
  children: ReactNode
  onClick: () => void
  actions: SplitButtonAction[]
  variant?: ButtonProps['variant']
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

/** Primary action plus a dropdown of secondary actions, visually fused into one control. */
export function SplitButton({ children, onClick, actions, variant = 'primary', size = 'md', disabled, loading }: SplitButtonProps) {
  return (
    <ButtonGroup attached>
      <Button variant={variant} size={size} disabled={disabled} loading={loading} onClick={onClick}>
        {children}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <IconButton
            variant={variant}
            size={size}
            icon={<ChevronDown />}
            label="More actions"
            disabled={disabled}
            className="border-l border-l-current/20"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent placement="bottom-end">
          {actions.map((action) => (
            <DropdownMenuItem key={action.id} icon={action.icon} danger={action.danger} onSelect={action.onSelect}>
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
