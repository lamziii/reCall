import { QUICK_ACTIONS, type QuickActionPreference, type RecallPreferences } from './types'

/** Bump when the shape changes in a way that needs migratePreferences() to do real work. */
export const SETTINGS_SCHEMA_VERSION = 1

const DEFAULT_QUICK_ACTIONS: QuickActionPreference[] = QUICK_ACTIONS.map((a) => ({ id: a.value, enabled: true }))

/**
 * The single source of truth for every default. Reset (all/section/field) reads from here — never
 * duplicate a default value inside a component. `updatedAt` is stamped 0 so a freshly-defaulted
 * object always loses a timestamp comparison against real saved data.
 */
export const DEFAULT_RECALL_PREFERENCES: RecallPreferences = {
  version: SETTINGS_SCHEMA_VERSION,
  updatedAt: 0,
  appearance: {
    accentColor: 'blue',
    sidebarStyle: 'floating',
    density: 'default',
    radius: 'subtle',
    glassEffect: false,
    shadows: 'standard',
    animations: {
      enabled: true,
      reduceMotion: false,
      pageTransitions: true,
      hoverAnimations: true,
      decorativeEffects: true,
    },
    typography: {
      font: 'inter',
      size: 'medium',
      lineHeight: 'default',
    },
    sidebarIconStyle: 'outline',
    dashboardLayout: 'mixed',
    sessionDensity: 'document',
    codeBlockTheme: 'one-dark',
  },
  workspace: {
    landingPage: 'home',
    defaultSessionView: 'overview',
    aiPanelPosition: 'right',
    transcriptWidth: 'medium',
    autoCollapse: {
      decisions: false,
      risks: false,
      documents: false,
      timeline: false,
    },
  },
  notes: {
    editorWidth: 'default',
    textSize: 'default',
    lineHeight: 'comfortable',
    slashCommands: true,
    markdownShortcuts: true,
    spellcheck: true,
    showMeetingTimestamps: true,
    showMarkedMoments: true,
    codeTheme: 'system',
    showCodeLanguageSelector: true,
    showCopyButton: true,
    defaultTableSize: 3,
    defaultPaperStyle: 'blank',
  },
  productivity: {
    autoExpandLatestSession: false,
    autoResumeRecording: true,
    rememberLastFilters: true,
    recentlyOpenedCount: 10,
    quickActions: DEFAULT_QUICK_ACTIONS,
  },
  ai: {
    responseStyle: 'balanced',
    summaryStyle: 'executive',
    taskDetection: 'balanced',
    timestampPrecision: 'speaker-changes',
    citationStyle: 'relevant',
  },
  accessibility: {
    highContrast: false,
    dyslexiaFriendlyFont: false,
    largerClickTargets: false,
    keyboardFocusHighlights: false,
    alwaysVisibleScrollbars: false,
  },
  personalization: {
    avatarStyle: 'initials',
    greeting: 'personalized',
    dateFormat: 'mdy',
    timeFormat: '12h',
    language: 'en',
  },
  experimental: {},
  advanced: {
    developerMode: false,
  },
}
