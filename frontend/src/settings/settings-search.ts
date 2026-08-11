// Lightweight settings search — a flat, hand-authored index (label + description + keywords per
// control). `id` doubles as the DOM anchor: each SettingRow renders id={id}, so a result can scroll
// its row into view and briefly highlight it. Not a command palette — just a filter.

import type { SettingsSectionKey } from './types'

export interface SettingsSearchEntry {
  id: string
  section: SettingsSectionKey
  label: string
  description: string
  keywords?: string
}

export const SETTINGS_SEARCH_INDEX: SettingsSearchEntry[] = [
  // Appearance
  { id: 'set-accent', section: 'appearance', label: 'Accent color', description: 'The single accent used across Recall.', keywords: 'blue purple emerald orange rose slate color' },
  { id: 'set-sidebar-style', section: 'appearance', label: 'Sidebar style', description: 'Floating, attached, compact, or expanded.', keywords: 'navigation layout' },
  { id: 'set-density', section: 'appearance', label: 'UI density', description: 'Adjust spacing and row height throughout Recall.', keywords: 'spacing compact comfortable' },
  { id: 'set-radius', section: 'appearance', label: 'Border radius', description: 'Sharp, subtle, or rounded corners.', keywords: 'corners rounded' },
  { id: 'set-glass', section: 'appearance', label: 'Glass effect', description: 'Subtle transparency and blur on supported surfaces.', keywords: 'blur transparency glassmorphism' },
  { id: 'set-shadows', section: 'appearance', label: 'Shadows', description: 'Minimal, standard, or elevated depth.', keywords: 'depth elevation' },
  { id: 'set-animations', section: 'appearance', label: 'Animations', description: 'Motion, page transitions, and hover effects.', keywords: 'motion transitions' },
  { id: 'set-typography', section: 'appearance', label: 'Typography', description: 'Font, text size, and line height.', keywords: 'font inter geist size line height' },
  { id: 'set-icon-style', section: 'appearance', label: 'Sidebar icon style', description: 'Outline, filled, or duotone icons.', keywords: 'icons' },
  { id: 'set-dashboard-layout', section: 'appearance', label: 'Dashboard layout', description: 'Cards, lists, or mixed.', keywords: 'home' },
  { id: 'set-session-density', section: 'appearance', label: 'Session density', description: 'How session content and transcript blocks are presented.', keywords: 'chat document compact transcript' },
  { id: 'set-code-theme', section: 'appearance', label: 'Code block theme', description: 'GitHub, One Dark, or Dracula.', keywords: 'syntax highlighting developer' },
  // Workspace
  { id: 'set-landing', section: 'workspace', label: 'Default landing page', description: 'Where Recall opens.', keywords: 'home sessions tasks projects calendar start' },
  { id: 'set-session-view', section: 'workspace', label: 'Default session view', description: 'Which tab opens when you enter a session.', keywords: 'overview transcript ai chat tasks' },
  { id: 'set-ai-panel', section: 'workspace', label: 'AI panel position', description: 'Show the AI panel on the left or right.', keywords: 'assistant sidebar' },
  { id: 'set-transcript-width', section: 'workspace', label: 'Transcript width', description: 'Narrow, medium, wide, or full.', keywords: 'reading measure' },
  { id: 'set-auto-collapse', section: 'workspace', label: 'Auto collapse sections', description: 'Which session sections start collapsed.', keywords: 'decisions risks documents timeline' },
  // Productivity
  { id: 'set-auto-expand', section: 'productivity', label: 'Auto expand latest session', description: 'Open your most recently active session on return.', keywords: 'resume' },
  { id: 'set-auto-resume', section: 'productivity', label: 'Auto resume recording', description: 'Recover unfinished recordings after a crash.', keywords: 'recording recover' },
  { id: 'set-remember-filters', section: 'productivity', label: 'Remember last filters', description: 'Keep filters and sorting on lists.', keywords: 'sort' },
  { id: 'set-recent-count', section: 'productivity', label: 'Recently opened count', description: 'How many recent items to keep.', keywords: 'history' },
  { id: 'set-quick-actions', section: 'productivity', label: 'Quick actions', description: 'Customize which quick actions appear.', keywords: 'shortcuts new recording upload' },
  // AI
  { id: 'set-ai-response', section: 'ai', label: 'AI response style', description: 'Concise, balanced, or detailed.', keywords: 'length' },
  { id: 'set-summary-style', section: 'ai', label: 'Summary style', description: 'Executive, bullet list, or narrative.', keywords: 'summary' },
  { id: 'set-task-detection', section: 'ai', label: 'Task detection', description: 'How readily Recall turns commitments into tasks.', keywords: 'action items' },
  { id: 'set-timestamp-precision', section: 'ai', label: 'Timestamp precision', description: 'How often timestamps appear in transcripts.', keywords: 'time transcript' },
  { id: 'set-citation', section: 'ai', label: 'Citation style', description: 'When Recall cites the transcript.', keywords: 'sources evidence' },
  // Accessibility
  { id: 'set-high-contrast', section: 'accessibility', label: 'High contrast', description: 'Increase contrast for readability.', keywords: 'vision' },
  { id: 'set-dyslexia-font', section: 'accessibility', label: 'Dyslexia-friendly font', description: 'Use a more legible typeface.', keywords: 'reading' },
  { id: 'set-large-targets', section: 'accessibility', label: 'Larger click targets', description: 'Bigger interactive areas.', keywords: 'touch tap' },
  { id: 'set-focus-highlights', section: 'accessibility', label: 'Keyboard focus highlights', description: 'Stronger focus outlines.', keywords: 'keyboard' },
  { id: 'set-scrollbars', section: 'accessibility', label: 'Always visible scrollbars', description: 'Keep scrollbars on screen.', keywords: 'scroll' },
  { id: 'set-reduce-motion', section: 'accessibility', label: 'Reduce motion', description: 'Minimize animation and movement.', keywords: 'animation motion vestibular' },
  // Personalization
  { id: 'set-avatar', section: 'personalization', label: 'Avatar style', description: 'Initials, photo, or monogram.', keywords: 'profile picture' },
  { id: 'set-greeting', section: 'personalization', label: 'Greeting', description: 'Personalized or minimal home greeting.', keywords: 'welcome home' },
  { id: 'set-date-format', section: 'personalization', label: 'Date format', description: 'How dates are displayed.', keywords: 'calendar' },
  { id: 'set-time-format', section: 'personalization', label: 'Time format', description: '12-hour or 24-hour.', keywords: 'clock' },
  { id: 'set-language', section: 'personalization', label: 'Language', description: 'Interface language.', keywords: 'locale english' },
  // Advanced
  { id: 'set-clear-cache', section: 'advanced', label: 'Clear local cache', description: 'Remove safe cached data on this device.', keywords: 'cache storage' },
  { id: 'set-reset-layout', section: 'advanced', label: 'Reset layout', description: 'Restore sidebar, panels, and widths.', keywords: 'layout' },
  { id: 'set-export', section: 'advanced', label: 'Export preferences', description: 'Download your preferences as JSON.', keywords: 'backup json' },
  { id: 'set-import', section: 'advanced', label: 'Import preferences', description: 'Load preferences from a JSON file.', keywords: 'restore json' },
  { id: 'set-developer-mode', section: 'advanced', label: 'Developer mode', description: 'Unlock technical details and diagnostics.', keywords: 'debug' },
  { id: 'set-reset-all', section: 'advanced', label: 'Reset all settings', description: 'Restore every setting to its default.', keywords: 'defaults' },
]

export function searchSettings(query: string): SettingsSearchEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  return SETTINGS_SEARCH_INDEX.filter((entry) => {
    const haystack = `${entry.label} ${entry.description} ${entry.keywords ?? ''} ${entry.section}`.toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}
