// Reflects preferences onto <html> as data-* attributes. CSS (styles/tokens/preferences.css) keys
// off these. Phase 1 wires the safe, purely-visual ones (accent, radius, font, text size, reduce
// motion, glass, high contrast). The rest are still applied as attributes so Prompt 2 can consume
// them by adding CSS/behavior — no Settings rework needed. Idempotent; safe to call on every change.

import type { RecallPreferences } from './types'

export function applyPreferences(prefs: RecallPreferences): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  const a = prefs.appearance

  const attrs: Record<string, string> = {
    'data-accent': a.accentColor,
    'data-sidebar-style': a.sidebarStyle,
    'data-density': a.density,
    'data-radius': a.radius,
    'data-shadows': a.shadows,
    'data-glass': String(a.glassEffect),
    'data-font': a.typography.font,
    'data-text-size': a.typography.size,
    'data-line-height': a.typography.lineHeight,
    'data-icon-style': a.sidebarIconStyle,
    'data-dashboard-layout': a.dashboardLayout,
    'data-session-density': a.sessionDensity,
    'data-code-theme': a.codeBlockTheme,
    // Workspace layout prefs that map to CSS (transcript width). Others (panel position, default
    // view, auto-collapse) are behavioral and consumed in the relevant pages, not via attributes.
    'data-transcript-width': prefs.workspace.transcriptWidth,
    // reduceMotion has one home (appearance.animations.reduceMotion); also true when animations off.
    'data-reduce-motion': String(a.animations.reduceMotion || !a.animations.enabled),
    'data-animations': String(a.animations.enabled),
    'data-high-contrast': String(prefs.accessibility.highContrast),
    'data-dyslexia-font': String(prefs.accessibility.dyslexiaFriendlyFont),
    'data-large-targets': String(prefs.accessibility.largerClickTargets),
    'data-focus-highlights': String(prefs.accessibility.keyboardFocusHighlights),
    'data-scrollbars': prefs.accessibility.alwaysVisibleScrollbars ? 'always' : 'auto',
  }

  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
}
