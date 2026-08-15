// Recall preferences — the typed source of truth for the Settings system. Every option set is
// declared once as an `as const` array of { value, label, ... }; the union type is derived from it,
// and the same array drives both the UI controls and schema validation. No stringly-typed fields.
//
// NOTE ON THEME: the light/dark/system/midnight theme is owned by ThemeProvider (localStorage key
// `recall-theme`), which predates this system and applies before first paint. To keep ONE source of
// truth, theme is deliberately NOT part of RecallPreferences — the Appearance section binds its
// Theme control straight to useTheme(). Everything else lives here.

export interface PreferenceOption<T extends string> {
  value: T
  label: string
  description?: string
}

function opts<const T extends readonly PreferenceOption<string>[]>(o: T): T {
  return o
}

/* ------------------------------------------------------------------ Appearance */

export const ACCENT_OPTIONS = opts([
  { value: 'blue', label: 'Recall Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'orange', label: 'Orange' },
  { value: 'rose', label: 'Rose' },
  { value: 'slate', label: 'Slate' },
])
export type AccentColor = (typeof ACCENT_OPTIONS)[number]['value']

export const SIDEBAR_STYLE_OPTIONS = opts([
  { value: 'floating', label: 'Floating' },
  { value: 'attached', label: 'Attached' },
  { value: 'compact', label: 'Compact' },
  { value: 'expanded', label: 'Expanded' },
])
export type SidebarStyle = (typeof SIDEBAR_STYLE_OPTIONS)[number]['value']

export const DENSITY_OPTIONS = opts([
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
])
export type Density = (typeof DENSITY_OPTIONS)[number]['value']

export const RADIUS_OPTIONS = opts([
  { value: 'sharp', label: 'Sharp' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'rounded', label: 'Rounded' },
])
export type Radius = (typeof RADIUS_OPTIONS)[number]['value']

export const SHADOW_OPTIONS = opts([
  { value: 'minimal', label: 'Minimal' },
  { value: 'standard', label: 'Standard' },
  { value: 'elevated', label: 'Elevated' },
])
export type ShadowLevel = (typeof SHADOW_OPTIONS)[number]['value']

export const FONT_OPTIONS = opts([
  { value: 'inter', label: 'Inter' },
  { value: 'sf-pro', label: 'SF Pro' },
  { value: 'geist', label: 'Geist' },
])
export type FontChoice = (typeof FONT_OPTIONS)[number]['value']

export const TEXT_SIZE_OPTIONS = opts([
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
])
export type TextSize = (typeof TEXT_SIZE_OPTIONS)[number]['value']

export const LINE_HEIGHT_OPTIONS = opts([
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'relaxed', label: 'Relaxed' },
])
export type LineHeight = (typeof LINE_HEIGHT_OPTIONS)[number]['value']

export const ICON_STYLE_OPTIONS = opts([
  { value: 'outline', label: 'Outline' },
  { value: 'filled', label: 'Filled' },
  { value: 'duotone', label: 'Duotone' },
])
export type IconStyle = (typeof ICON_STYLE_OPTIONS)[number]['value']

export const DASHBOARD_LAYOUT_OPTIONS = opts([
  { value: 'cards', label: 'Cards' },
  { value: 'lists', label: 'Lists' },
  { value: 'mixed', label: 'Mixed' },
])
export type DashboardLayout = (typeof DASHBOARD_LAYOUT_OPTIONS)[number]['value']

export const SESSION_DENSITY_OPTIONS = opts([
  { value: 'chat', label: 'Chat' },
  { value: 'document', label: 'Document' },
  { value: 'compact', label: 'Compact' },
])
export type SessionDensity = (typeof SESSION_DENSITY_OPTIONS)[number]['value']

export const CODE_THEME_OPTIONS = opts([
  { value: 'github', label: 'GitHub' },
  { value: 'one-dark', label: 'One Dark' },
  { value: 'dracula', label: 'Dracula' },
])
export type CodeBlockTheme = (typeof CODE_THEME_OPTIONS)[number]['value']

export interface AnimationPreferences {
  enabled: boolean
  reduceMotion: boolean
  pageTransitions: boolean
  hoverAnimations: boolean
  decorativeEffects: boolean
}

export interface TypographyPreferences {
  font: FontChoice
  size: TextSize
  lineHeight: LineHeight
}

export interface AppearancePreferences {
  accentColor: AccentColor
  sidebarStyle: SidebarStyle
  density: Density
  radius: Radius
  glassEffect: boolean
  shadows: ShadowLevel
  animations: AnimationPreferences
  typography: TypographyPreferences
  sidebarIconStyle: IconStyle
  dashboardLayout: DashboardLayout
  sessionDensity: SessionDensity
  codeBlockTheme: CodeBlockTheme
}

/* ------------------------------------------------------------------ Workspace */

export const LANDING_PAGE_OPTIONS = opts([
  { value: 'home', label: 'Home' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'projects', label: 'Projects' },
  { value: 'calendar', label: 'Calendar' },
])
export type LandingPage = (typeof LANDING_PAGE_OPTIONS)[number]['value']

export const SESSION_VIEW_OPTIONS = opts([
  { value: 'overview', label: 'Overview' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'ai-chat', label: 'AI Chat' },
  { value: 'tasks', label: 'Tasks' },
])
export type SessionView = (typeof SESSION_VIEW_OPTIONS)[number]['value']

export const AI_PANEL_POSITION_OPTIONS = opts([
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
])
export type AiPanelPosition = (typeof AI_PANEL_POSITION_OPTIONS)[number]['value']

export const TRANSCRIPT_WIDTH_OPTIONS = opts([
  { value: 'narrow', label: 'Narrow' },
  { value: 'medium', label: 'Medium' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' },
])
export type TranscriptWidth = (typeof TRANSCRIPT_WIDTH_OPTIONS)[number]['value']

export interface AutoCollapsePreferences {
  decisions: boolean
  risks: boolean
  documents: boolean
  timeline: boolean
}

export interface WorkspacePreferences {
  landingPage: LandingPage
  defaultSessionView: SessionView
  aiPanelPosition: AiPanelPosition
  transcriptWidth: TranscriptWidth
  autoCollapse: AutoCollapsePreferences
}

/* ------------------------------------------------------------------ Productivity */

export const RECENT_COUNT_OPTIONS = [5, 10, 20, 50] as const
export type RecentCount = (typeof RECENT_COUNT_OPTIONS)[number]

export const QUICK_ACTIONS = opts([
  { value: 'new-recording', label: 'New Recording' },
  { value: 'upload-transcript', label: 'Upload Transcript' },
  { value: 'new-project', label: 'New Project' },
  { value: 'search', label: 'Search' },
])
export type QuickActionId = (typeof QUICK_ACTIONS)[number]['value']

export interface QuickActionPreference {
  id: QuickActionId
  enabled: boolean
}

export interface ProductivityPreferences {
  autoExpandLatestSession: boolean
  autoResumeRecording: boolean
  rememberLastFilters: boolean
  recentlyOpenedCount: RecentCount
  quickActions: QuickActionPreference[]
}

/* ------------------------------------------------------------------ AI */

export const AI_RESPONSE_STYLE_OPTIONS = opts([
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
])
export type AiResponseStyle = (typeof AI_RESPONSE_STYLE_OPTIONS)[number]['value']

export const SUMMARY_STYLE_OPTIONS = opts([
  { value: 'executive', label: 'Executive' },
  { value: 'bullets', label: 'Bullet List' },
  { value: 'narrative', label: 'Narrative' },
])
export type SummaryStyle = (typeof SUMMARY_STYLE_OPTIONS)[number]['value']

export const TASK_DETECTION_OPTIONS = opts([
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'aggressive', label: 'Aggressive' },
])
export type TaskDetection = (typeof TASK_DETECTION_OPTIONS)[number]['value']

export const TIMESTAMP_PRECISION_OPTIONS = opts([
  { value: 'every-message', label: 'Every message' },
  { value: 'speaker-changes', label: 'Speaker changes' },
  { value: 'decisions-only', label: 'Decisions only' },
  { value: 'hidden', label: 'Hidden' },
])
export type TimestampPrecision = (typeof TIMESTAMP_PRECISION_OPTIONS)[number]['value']

export const CITATION_STYLE_OPTIONS = opts([
  { value: 'always', label: 'Always cite transcript' },
  { value: 'relevant', label: 'Cite when relevant' },
  { value: 'never', label: 'Never show citations' },
])
export type CitationStyle = (typeof CITATION_STYLE_OPTIONS)[number]['value']

export interface AiPreferences {
  responseStyle: AiResponseStyle
  summaryStyle: SummaryStyle
  taskDetection: TaskDetection
  timestampPrecision: TimestampPrecision
  citationStyle: CitationStyle
}

/* ------------------------------------------------------------------ Accessibility */

export interface AccessibilityPreferences {
  highContrast: boolean
  dyslexiaFriendlyFont: boolean
  largerClickTargets: boolean
  keyboardFocusHighlights: boolean
  alwaysVisibleScrollbars: boolean
  // reduceMotion is intentionally NOT here — it lives at appearance.animations.reduceMotion (one
  // source of truth). Accessibility surfaces the same control via that key.
}

/* ------------------------------------------------------------------ Personalization */

export const AVATAR_STYLE_OPTIONS = opts([
  { value: 'initials', label: 'Initials' },
  { value: 'photo', label: 'Photo' },
  { value: 'monogram', label: 'Monogram' },
])
export type AvatarStyle = (typeof AVATAR_STYLE_OPTIONS)[number]['value']

export const GREETING_OPTIONS = opts([
  { value: 'personalized', label: 'Personalized' },
  { value: 'minimal', label: 'Minimal' },
])
export type GreetingStyle = (typeof GREETING_OPTIONS)[number]['value']

export const DATE_FORMAT_OPTIONS = opts([
  { value: 'mdy', label: 'MM/DD/YYYY' },
  { value: 'dmy', label: 'DD/MM/YYYY' },
  { value: 'iso', label: 'YYYY-MM-DD' },
  { value: 'relative', label: 'Relative' },
])
export type DateFormat = (typeof DATE_FORMAT_OPTIONS)[number]['value']

export const TIME_FORMAT_OPTIONS = opts([
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
])
export type TimeFormat = (typeof TIME_FORMAT_OPTIONS)[number]['value']

// Only genuinely supported languages. Add entries here as real translations land — do not fake them.
export const LANGUAGE_OPTIONS = opts([{ value: 'en', label: 'English' }])
export type AppLanguage = (typeof LANGUAGE_OPTIONS)[number]['value']

export interface PersonalizationPreferences {
  avatarStyle: AvatarStyle
  greeting: GreetingStyle
  dateFormat: DateFormat
  timeFormat: TimeFormat
  language: AppLanguage
}

/* ------------------------------------------------------------------ Experimental */

// Real experimental flags only. Empty for now → Settings shows a clean empty state. Add
// { id, label, description } entries as real beta features appear; the preference map keys off id.
export const EXPERIMENTAL_FEATURES = opts([]) as readonly { value: string; label: string; description?: string }[]
export type ExperimentalPreferences = Record<string, boolean>

/* ------------------------------------------------------------------ Advanced */

export interface AdvancedPreferences {
  developerMode: boolean
}

/* ------------------------------------------------------------------ Root */

export interface RecallPreferences {
  version: number
  updatedAt: number
  appearance: AppearancePreferences
  workspace: WorkspacePreferences
  productivity: ProductivityPreferences
  ai: AiPreferences
  accessibility: AccessibilityPreferences
  personalization: PersonalizationPreferences
  experimental: ExperimentalPreferences
  advanced: AdvancedPreferences
}

export type SettingsSectionKey =
  | 'appearance'
  | 'workspace'
  | 'productivity'
  | 'ai'
  | 'accessibility'
  | 'personalization'
  | 'experimental'
  | 'advanced'
