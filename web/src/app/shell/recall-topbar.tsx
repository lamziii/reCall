import { useNavigate, useLocation } from '@/lib/router-compat'
import { Bell, Menu, Plus, User } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { IconButton } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { SearchTrigger } from './search-trigger'
import { NotificationsMenu } from './notifications-menu'
import { ProfileMenu } from './profile-menu'
import { ThemeToggle } from '@/app/theme/theme-toggle'
import { RecallAiTrigger } from '@/components/ai/recall-ai-trigger'
import { APP_BASE, MAIN_NAV, getActiveNavItem } from './nav-config'

const QUICK_ADD_TARGETS = new Set([`${APP_BASE}/sessions`, `${APP_BASE}/projects`, `${APP_BASE}/tasks`])

export interface RecallTopbarProps {
  onOpenSearch: () => void
  onOpenMobileNav: () => void
  showMobileMenuButton: boolean
  aiOpen: boolean
  onToggleAi: () => void
}

export function RecallTopbar({ onOpenSearch, onOpenMobileNav, showMobileMenuButton, aiOpen, onToggleAi }: RecallTopbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const title = getActiveNavItem(location.pathname)?.label ?? 'Recall'

  return (
    <Header
      className="border-b border-transparent bg-bg/80 px-5 backdrop-blur-sm"
      left={
        <>
          {showMobileMenuButton && <IconButton icon={<Menu />} label="Open navigation" variant="ghost" onClick={onOpenMobileNav} />}
          <span className="text-body font-semibold text-foreground">{title}</span>
        </>
      }
      center={<SearchTrigger onClick={onOpenSearch} />}
      right={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <IconButton icon={<Plus />} label="Quick add" variant="secondary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent width={192} placement="bottom-end">
              <DropdownMenuLabel>Create new</DropdownMenuLabel>
              {MAIN_NAV.filter((item) => QUICK_ADD_TARGETS.has(item.to)).map((item) => (
                <DropdownMenuItem key={item.to} icon={<item.icon />} onSelect={() => navigate(item.to)}>
                  New {item.label.replace(/s$/, '').toLowerCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationsMenu trigger={<IconButton icon={<Bell />} label="Notifications" variant="ghost" />} />
          <ThemeToggle />
          <RecallAiTrigger open={aiOpen} onClick={onToggleAi} />
          <ProfileMenu trigger={<IconButton icon={<User />} label="Profile" variant="ghost" />} />
        </>
      }
    />
  )
}
