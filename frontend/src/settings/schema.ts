// Defensive sanitizer + import validator. No external validation lib — every option set is already
// an `as const` array, so membership checks are all we need. `sanitizePreferences` NEVER throws: it
// rebuilds a fully-valid RecallPreferences from arbitrary input, falling back to defaults per field.
// That one function powers three things: loading saved local/cloud prefs, migrating older shapes
// (missing keys → defaults), and validating imports (unknown keys/values are dropped, not merged).

import { DEFAULT_RECALL_PREFERENCES, SETTINGS_SCHEMA_VERSION } from './defaults'
import {
  ACCENT_OPTIONS,
  AI_PANEL_POSITION_OPTIONS,
  AI_RESPONSE_STYLE_OPTIONS,
  AVATAR_STYLE_OPTIONS,
  CITATION_STYLE_OPTIONS,
  CODE_THEME_OPTIONS,
  DASHBOARD_LAYOUT_OPTIONS,
  DATE_FORMAT_OPTIONS,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  GREETING_OPTIONS,
  ICON_STYLE_OPTIONS,
  LANDING_PAGE_OPTIONS,
  LANGUAGE_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  QUICK_ACTIONS,
  RADIUS_OPTIONS,
  RECENT_COUNT_OPTIONS,
  SESSION_DENSITY_OPTIONS,
  SESSION_VIEW_OPTIONS,
  SHADOW_OPTIONS,
  SUMMARY_STYLE_OPTIONS,
  TASK_DETECTION_OPTIONS,
  TEXT_SIZE_OPTIONS,
  TIMESTAMP_PRECISION_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TRANSCRIPT_WIDTH_OPTIONS,
  type QuickActionPreference,
  type RecallPreferences,
} from './types'

type Obj = Record<string, unknown>
const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {})
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

/** Returns `v` if it's one of `options`' values, else `fallback`. */
function pick<T extends string>(v: unknown, options: readonly { value: T }[], fallback: T): T {
  return typeof v === 'string' && options.some((o) => o.value === v) ? (v as T) : fallback
}

function pickNumber<T extends number>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'number' && (allowed as readonly number[]).includes(v) ? (v as T) : fallback
}

/** Preserves the user's order + enabled flags, drops unknown ids, and appends any missing known ids. */
function sanitizeQuickActions(v: unknown, fallback: QuickActionPreference[]): QuickActionPreference[] {
  if (!Array.isArray(v)) return fallback.map((a) => ({ ...a }))
  const known = new Set(QUICK_ACTIONS.map((a) => a.value))
  const seen = new Set<string>()
  const out: QuickActionPreference[] = []
  for (const raw of v) {
    const o = asObj(raw)
    const id = o.id
    if (typeof id === 'string' && known.has(id as never) && !seen.has(id)) {
      seen.add(id)
      out.push({ id: id as QuickActionPreference['id'], enabled: bool(o.enabled, true) })
    }
  }
  for (const a of QUICK_ACTIONS) if (!seen.has(a.value)) out.push({ id: a.value, enabled: true })
  return out
}

/** Only keeps experimental flags whose ids are real (see EXPERIMENTAL_FEATURES). Values coerced to bool. */
function sanitizeExperimental(v: unknown): Record<string, boolean> {
  const src = asObj(v)
  const out: Record<string, boolean> = {}
  // Currently no experimental features exist, so this drops everything. When features are added,
  // gate on their ids here so stale/foreign flags can never leak into app state.
  for (const key of Object.keys(out)) out[key] = bool(src[key], false)
  return out
}

/**
 * Rebuild a fully-valid RecallPreferences from anything. Missing/invalid fields fall back to
 * DEFAULT_RECALL_PREFERENCES. `updatedAt` is preserved when present (for conflict resolution).
 */
export function sanitizePreferences(raw: unknown): RecallPreferences {
  const d = DEFAULT_RECALL_PREFERENCES
  const r = asObj(raw)
  const ap = asObj(r.appearance)
  const anim = asObj(ap.animations)
  const typo = asObj(ap.typography)
  const ws = asObj(r.workspace)
  const collapse = asObj(ws.autoCollapse)
  const prod = asObj(r.productivity)
  const ai = asObj(r.ai)
  const a11y = asObj(r.accessibility)
  const pers = asObj(r.personalization)
  const adv = asObj(r.advanced)

  return {
    version: SETTINGS_SCHEMA_VERSION,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : d.updatedAt,
    appearance: {
      accentColor: pick(ap.accentColor, ACCENT_OPTIONS, d.appearance.accentColor),
      sidebarStyle: pick(ap.sidebarStyle, [{ value: 'floating' }, { value: 'attached' }, { value: 'compact' }, { value: 'expanded' }], d.appearance.sidebarStyle),
      density: pick(ap.density, DENSITY_OPTIONS, d.appearance.density),
      radius: pick(ap.radius, RADIUS_OPTIONS, d.appearance.radius),
      glassEffect: bool(ap.glassEffect, d.appearance.glassEffect),
      shadows: pick(ap.shadows, SHADOW_OPTIONS, d.appearance.shadows),
      animations: {
        enabled: bool(anim.enabled, d.appearance.animations.enabled),
        reduceMotion: bool(anim.reduceMotion, d.appearance.animations.reduceMotion),
        pageTransitions: bool(anim.pageTransitions, d.appearance.animations.pageTransitions),
        hoverAnimations: bool(anim.hoverAnimations, d.appearance.animations.hoverAnimations),
        decorativeEffects: bool(anim.decorativeEffects, d.appearance.animations.decorativeEffects),
      },
      typography: {
        font: pick(typo.font, FONT_OPTIONS, d.appearance.typography.font),
        size: pick(typo.size, TEXT_SIZE_OPTIONS, d.appearance.typography.size),
        lineHeight: pick(typo.lineHeight, LINE_HEIGHT_OPTIONS, d.appearance.typography.lineHeight),
      },
      sidebarIconStyle: pick(ap.sidebarIconStyle, ICON_STYLE_OPTIONS, d.appearance.sidebarIconStyle),
      dashboardLayout: pick(ap.dashboardLayout, DASHBOARD_LAYOUT_OPTIONS, d.appearance.dashboardLayout),
      sessionDensity: pick(ap.sessionDensity, SESSION_DENSITY_OPTIONS, d.appearance.sessionDensity),
      codeBlockTheme: pick(ap.codeBlockTheme, CODE_THEME_OPTIONS, d.appearance.codeBlockTheme),
    },
    workspace: {
      landingPage: pick(ws.landingPage, LANDING_PAGE_OPTIONS, d.workspace.landingPage),
      defaultSessionView: pick(ws.defaultSessionView, SESSION_VIEW_OPTIONS, d.workspace.defaultSessionView),
      aiPanelPosition: pick(ws.aiPanelPosition, AI_PANEL_POSITION_OPTIONS, d.workspace.aiPanelPosition),
      transcriptWidth: pick(ws.transcriptWidth, TRANSCRIPT_WIDTH_OPTIONS, d.workspace.transcriptWidth),
      autoCollapse: {
        decisions: bool(collapse.decisions, d.workspace.autoCollapse.decisions),
        risks: bool(collapse.risks, d.workspace.autoCollapse.risks),
        documents: bool(collapse.documents, d.workspace.autoCollapse.documents),
        timeline: bool(collapse.timeline, d.workspace.autoCollapse.timeline),
      },
    },
    productivity: {
      autoExpandLatestSession: bool(prod.autoExpandLatestSession, d.productivity.autoExpandLatestSession),
      autoResumeRecording: bool(prod.autoResumeRecording, d.productivity.autoResumeRecording),
      rememberLastFilters: bool(prod.rememberLastFilters, d.productivity.rememberLastFilters),
      recentlyOpenedCount: pickNumber(prod.recentlyOpenedCount, RECENT_COUNT_OPTIONS, d.productivity.recentlyOpenedCount),
      quickActions: sanitizeQuickActions(prod.quickActions, d.productivity.quickActions),
    },
    ai: {
      responseStyle: pick(ai.responseStyle, AI_RESPONSE_STYLE_OPTIONS, d.ai.responseStyle),
      summaryStyle: pick(ai.summaryStyle, SUMMARY_STYLE_OPTIONS, d.ai.summaryStyle),
      taskDetection: pick(ai.taskDetection, TASK_DETECTION_OPTIONS, d.ai.taskDetection),
      timestampPrecision: pick(ai.timestampPrecision, TIMESTAMP_PRECISION_OPTIONS, d.ai.timestampPrecision),
      citationStyle: pick(ai.citationStyle, CITATION_STYLE_OPTIONS, d.ai.citationStyle),
    },
    accessibility: {
      highContrast: bool(a11y.highContrast, d.accessibility.highContrast),
      dyslexiaFriendlyFont: bool(a11y.dyslexiaFriendlyFont, d.accessibility.dyslexiaFriendlyFont),
      largerClickTargets: bool(a11y.largerClickTargets, d.accessibility.largerClickTargets),
      keyboardFocusHighlights: bool(a11y.keyboardFocusHighlights, d.accessibility.keyboardFocusHighlights),
      alwaysVisibleScrollbars: bool(a11y.alwaysVisibleScrollbars, d.accessibility.alwaysVisibleScrollbars),
    },
    personalization: {
      avatarStyle: pick(pers.avatarStyle, AVATAR_STYLE_OPTIONS, d.personalization.avatarStyle),
      greeting: pick(pers.greeting, GREETING_OPTIONS, d.personalization.greeting),
      dateFormat: pick(pers.dateFormat, DATE_FORMAT_OPTIONS, d.personalization.dateFormat),
      timeFormat: pick(pers.timeFormat, TIME_FORMAT_OPTIONS, d.personalization.timeFormat),
      language: pick(pers.language, LANGUAGE_OPTIONS, d.personalization.language),
    },
    experimental: sanitizeExperimental(r.experimental),
    advanced: {
      developerMode: bool(adv.developerMode, d.advanced.developerMode),
    },
  }
}

export const PREFERENCES_EXPORT_TYPE = 'recall-preferences'

export interface PreferencesExport {
  type: typeof PREFERENCES_EXPORT_TYPE
  version: number
  exportedAt: string
  preferences: RecallPreferences
}

export type ImportResult =
  | { ok: true; value: RecallPreferences }
  | { ok: false; error: string }

/**
 * Validates an imported export envelope and returns sanitized preferences. Rejects anything that
 * isn't the expected `{ type, version, preferences }` shape; sanitizes the payload so no unknown
 * key/value can ever reach app state (never a blind merge).
 */
export function validateImportedPreferences(raw: unknown): ImportResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'File is not a valid preferences export.' }
  const env = raw as Obj
  if (env.type !== PREFERENCES_EXPORT_TYPE) return { ok: false, error: 'This file is not a Recall preferences export.' }
  if (typeof env.version !== 'number') return { ok: false, error: 'Export is missing a version.' }
  if (env.version > SETTINGS_SCHEMA_VERSION) return { ok: false, error: 'This export is from a newer version of Recall.' }
  if (!env.preferences || typeof env.preferences !== 'object') return { ok: false, error: 'Export contains no preferences.' }
  return { ok: true, value: sanitizePreferences(env.preferences) }
}

/** Builds the export envelope — preferences only, never auth/session/transcript data. */
export function buildPreferencesExport(preferences: RecallPreferences): PreferencesExport {
  return {
    type: PREFERENCES_EXPORT_TYPE,
    version: SETTINGS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    preferences,
  }
}
