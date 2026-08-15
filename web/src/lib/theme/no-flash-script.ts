/**
 * The blocking, pre-hydration theme/appearance script — ported verbatim from the Vite app's
 * index.html <head>. It must run before first paint (injected via a plain <script> in the root
 * layout, NOT a Next <Script> with a deferring strategy) so there is no flash of the wrong theme.
 * Mirrors theme-provider.tsx + settings/apply-preferences.ts resolution exactly. Keep in sync.
 */
export const NO_FLASH_SCRIPT = `(function () {
  try {
    var STORAGE_KEY = 'recall-theme'
    var stored = localStorage.getItem(STORAGE_KEY)
    var preference =
      stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'midnight' ? stored : 'system'
    var resolved =
      preference === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : preference === 'midnight'
          ? 'dark'
          : preference
    document.documentElement.setAttribute('data-theme', resolved)
    if (preference === 'midnight') document.documentElement.setAttribute('data-midnight', 'true')
    try {
      var prefs = JSON.parse(localStorage.getItem('recall-preferences') || '{}')
      var a = prefs.appearance || {}
      var root = document.documentElement
      if (a.accentColor) root.setAttribute('data-accent', a.accentColor)
      if (a.radius) root.setAttribute('data-radius', a.radius)
      if (a.typography && a.typography.font) root.setAttribute('data-font', a.typography.font)
      var anim = a.animations || {}
      if (anim.reduceMotion === true || anim.enabled === false) root.setAttribute('data-reduce-motion', 'true')
      var a11y = prefs.accessibility || {}
      if (a11y.highContrast === true) root.setAttribute('data-high-contrast', 'true')
      if (a11y.alwaysVisibleScrollbars === true) root.setAttribute('data-scrollbars', 'always')
    } catch (e2) {}
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})()`
