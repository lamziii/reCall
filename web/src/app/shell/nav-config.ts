import {
  BarChart3,
  BarChart3Solid,
  Calendar,
  CalendarSolid,
  CheckSquare,
  CheckSquareSolid,
  ClipboardCheck,
  ClipboardCheckSolid,
  FolderKanban,
  FolderKanbanSolid,
  Home,
  HomeSolid,
  Mic,
  MicSolid,
  NotebookText,
  NotebookTextSolid,
  Settings,
  SettingsSolid,
  Sparkles,
  SparklesSolid,
  Users,
  UsersRound,
  UsersRoundSolid,
  UsersSolid,
  type IconComponent,
} from '@/components/icons'

export const APP_BASE = '/app'

export interface NavItem {
  label: string
  to: string
  /** Outline (line) variant — the default. */
  icon: IconComponent
  /** Filled (solid) variant — used when the sidebar icon-style preference is filled/duotone. */
  iconSolid: IconComponent
  /** Match only the exact path — otherwise nested routes under it would also show this item as active. */
  end?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Home', to: APP_BASE, icon: Home, iconSolid: HomeSolid, end: true },
  { label: 'Recall AI', to: `${APP_BASE}/assistant`, icon: Sparkles, iconSolid: SparklesSolid },
  { label: 'Sessions', to: `${APP_BASE}/sessions`, icon: Mic, iconSolid: MicSolid },
  { label: 'Notes', to: `${APP_BASE}/notes`, icon: NotebookText, iconSolid: NotebookTextSolid },
  { label: 'Projects', to: `${APP_BASE}/projects`, icon: FolderKanban, iconSolid: FolderKanbanSolid },
  { label: 'Tasks', to: `${APP_BASE}/tasks`, icon: CheckSquare, iconSolid: CheckSquareSolid },
  { label: 'Calendar', to: `${APP_BASE}/calendar`, icon: Calendar, iconSolid: CalendarSolid },
  { label: 'Usage', to: `${APP_BASE}/usage`, icon: BarChart3, iconSolid: BarChart3Solid },
]

export const WORKSPACE_NAV: NavItem[] = [
  { label: 'People', to: `${APP_BASE}/people`, icon: Users, iconSolid: UsersSolid },
  { label: 'Teams', to: `${APP_BASE}/teams`, icon: UsersRound, iconSolid: UsersRoundSolid },
  { label: 'Reviews', to: `${APP_BASE}/reviews`, icon: ClipboardCheck, iconSolid: ClipboardCheckSolid },
]

export const SETTINGS_NAV: NavItem = { label: 'Settings', to: `${APP_BASE}/settings`, icon: Settings, iconSolid: SettingsSolid, end: true }

/** Every navigable destination, flattened — used to derive the current page title and to feed the command palette. */
export const ALL_NAV_ITEMS: NavItem[] = [...MAIN_NAV, ...WORKSPACE_NAV, SETTINGS_NAV]

/** Resolves the nav item whose route matches (or is a parent of) the given pathname — powers the topbar's page title. */
export function getActiveNavItem(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)))
}
