// Central preference RESOLUTION — turns raw user settings + environment (OS signals) into the
// effective runtime flags the app should obey. Precedence lives here ONCE, never re-derived inside
// components. CSS handles the purely-visual settings (theme/accent/density/radius/type/shadows via
// data-* attributes); this file handles the rules that JS must branch on (motion) and documents the
// precedence for the rest.
//
// Precedence rules:
//  • Reduce motion  = user.reduceMotion OR OS prefers-reduced-motion OR animations disabled.
//                     Accessibility/OS win over a more permissive user choice.
//  • Page / hover / decorative motion are all forced off whenever reduceMotion is true (Animations
//    Off and OS reduced-motion both dominate their sub-toggles).
//  • Dyslexia-friendly font overrides the Appearance font choice (handled in CSS: data-dyslexia-font
//    wins over data-font).
//  • Larger click targets win over Compact density for hit area (CSS: data-large-targets min-size
//    beats the smaller --spacing-derived control height).

import type { RecallPreferences } from './types'

export interface ResolvedPreferences {
  /** Any nonessential motion should be suppressed. */
  reduceMotion: boolean
  /** Route/page transition effects may run. */
  pageTransitions: boolean
  /** Nonessential hover movement may run (hover COLOR changes always remain). */
  hoverAnimations: boolean
  /** Ambient/decorative flourishes may run. */
  decorativeEffects: boolean
}

export interface ResolveEnv {
  /** OS `prefers-reduced-motion: reduce`. */
  systemReduceMotion: boolean
}

export function resolvePreferences(prefs: RecallPreferences, env: ResolveEnv): ResolvedPreferences {
  const anim = prefs.appearance.animations
  const animationsOff = !anim.enabled
  const reduceMotion = anim.reduceMotion || env.systemReduceMotion || animationsOff
  return {
    reduceMotion,
    pageTransitions: !reduceMotion && anim.pageTransitions,
    hoverAnimations: !reduceMotion && anim.hoverAnimations,
    decorativeEffects: !reduceMotion && anim.decorativeEffects,
  }
}
