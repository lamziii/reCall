import type { ReactElement } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { LogOut, Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { Placement } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { APP_BASE } from './nav-config'

export interface ProfileMenuProps {
  trigger: ReactElement<Record<string, unknown>>
  placement?: Placement
}

/** Shared account menu — same items whether opened from the sidebar footer or the topbar. */
export function ProfileMenu({ trigger, placement = 'bottom-end' }: ProfileMenuProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent width={200} placement={placement}>
        <DropdownMenuItem icon={<Settings />} onSelect={() => navigate(`${APP_BASE}/settings`)}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<LogOut />} danger onSelect={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
