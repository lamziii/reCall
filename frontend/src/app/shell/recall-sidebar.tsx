import { useNavigate } from 'react-router-dom'
import { Bell, CircleQuestionMark, PanelLeftClose, PanelLeftOpen, Settings, User } from 'lucide-react'
import { Sidebar, SidebarHeader, SidebarSection, SidebarItem, SidebarButtonItem, SidebarFooter } from '@/components/layout/sidebar'
import { Logo } from '@/components/branding/logo'
import { IconButton } from '@/components/ui/button'
import { UserMenuTrigger } from '@/components/data-display/user-menu-trigger'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { NotificationsMenu } from './notifications-menu'
import { ProfileMenu } from './profile-menu'
import { APP_BASE, MAIN_NAV, WORKSPACE_NAV } from './nav-config'
import { cn } from '@/lib/utils'

export interface RecallSidebarProps {
  collapsed: boolean
  onToggleCollapsed?: () => void
  /** Hide the collapse/expand affordance — the mobile slide-over is always shown full-width and dismisses via its own close button instead. */
  showCollapseToggle?: boolean
}

/** The one permanent left-hand nav — same instance whether it's rendered inline (desktop/tablet) or inside a Sheet (mobile). */
export function RecallSidebar({ collapsed, onToggleCollapsed, showCollapseToggle = true }: RecallSidebarProps) {
  const navigate = useNavigate()

  return (
    <Sidebar collapsed={collapsed}>
      <SidebarHeader className={cn('justify-between', collapsed && 'justify-center')}>
        <a href="/" className="focus-ring flex shrink-0 items-center rounded-md" aria-label="Recall home">
          <Logo size="sm" />
        </a>
        {showCollapseToggle && !collapsed && (
          <IconButton icon={<PanelLeftClose />} label="Collapse sidebar" variant="ghost" size="sm" onClick={onToggleCollapsed} />
        )}
      </SidebarHeader>

      {showCollapseToggle && collapsed ? (
        <div className="flex justify-center px-2 pb-2">
          <IconButton icon={<PanelLeftOpen />} label="Expand sidebar" variant="ghost" size="sm" onClick={onToggleCollapsed} />
        </div>
      ) : (
        <div className="px-2 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <UserMenuTrigger name="Workspace" subtitle="Free plan" />
            </DropdownMenuTrigger>
            <DropdownMenuContent width={208}>
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuItem icon={<Settings />} onSelect={() => navigate(`${APP_BASE}/settings`)}>
                Workspace settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SidebarSection label="Main">
          {MAIN_NAV.map((item) => (
            <SidebarItem key={item.to} to={item.to} end={item.end} icon={<item.icon />}>
              {item.label}
            </SidebarItem>
          ))}
        </SidebarSection>

        <SidebarSection label="Workspace">
          {WORKSPACE_NAV.map((item) => (
            <SidebarItem key={item.to} to={item.to} icon={<item.icon />}>
              {item.label}
            </SidebarItem>
          ))}

          <NotificationsMenu placement="right" trigger={<SidebarButtonItem icon={<Bell />}>Notifications</SidebarButtonItem>} />
        </SidebarSection>
      </div>

      <SidebarFooter>
        <SidebarItem to={`${APP_BASE}/settings`} icon={<Settings />}>
          Settings
        </SidebarItem>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <SidebarButtonItem icon={<CircleQuestionMark />}>Help</SidebarButtonItem>
          </DropdownMenuTrigger>
          <DropdownMenuContent width={200} placement="right">
            <DropdownMenuLabel>Help</DropdownMenuLabel>
            <DropdownMenuItem>Documentation</DropdownMenuItem>
            <DropdownMenuItem>Contact support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileMenu placement="right" trigger={<SidebarButtonItem icon={<User />}>Profile</SidebarButtonItem>} />
      </SidebarFooter>
    </Sidebar>
  )
}
