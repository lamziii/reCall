import type { LucideIcon } from 'lucide-react'
import { Calendar, CheckSquare, ClipboardCheck, FolderKanban, Gauge, Home, Mic, Settings, Sparkles, Users, UsersRound } from 'lucide-react'

export const APP_BASE = '/app'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Match only the exact path — otherwise nested routes under it would also show this item as active. */
  end?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Home', to: APP_BASE, icon: Home, end: true },
  { label: 'Recall AI', to: `${APP_BASE}/assistant`, icon: Sparkles },
  { label: 'Sessions', to: `${APP_BASE}/sessions`, icon: Mic },
  { label: 'Projects', to: `${APP_BASE}/projects`, icon: FolderKanban },
  { label: 'Tasks', to: `${APP_BASE}/tasks`, icon: CheckSquare },
  { label: 'Calendar', to: `${APP_BASE}/calendar`, icon: Calendar },
  { label: 'Usage', to: `${APP_BASE}/usage`, icon: Gauge },
]

export const WORKSPACE_NAV: NavItem[] = [
  { label: 'People', to: `${APP_BASE}/people`, icon: Users },
  { label: 'Teams', to: `${APP_BASE}/teams`, icon: UsersRound },
  { label: 'Reviews', to: `${APP_BASE}/reviews`, icon: ClipboardCheck },
]

export const SETTINGS_NAV: NavItem = { label: 'Settings', to: `${APP_BASE}/settings`, icon: Settings, end: true }

/** Every navigable destination, flattened — used to derive the current page title and to feed the command palette. */
export const ALL_NAV_ITEMS: NavItem[] = [...MAIN_NAV, ...WORKSPACE_NAV, SETTINGS_NAV]

/** Resolves the nav item whose route matches (or is a parent of) the given pathname — powers the topbar's page title. */
export function getActiveNavItem(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)))
}
