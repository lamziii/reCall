import { useRecallPreferences } from '@/settings/settings-context'
import { SettingRow, SettingsSection, SettingsToggle } from '../settings-controls'

const TOGGLES = [
  ['highContrast', 'High contrast', 'Increase contrast between text and surfaces.'],
  ['dyslexiaFriendlyFont', 'Dyslexia-friendly font', 'Use a more legible typeface across Recall.'],
  ['largerClickTargets', 'Larger click targets', 'Increase the size of interactive areas.'],
  ['keyboardFocusHighlights', 'Keyboard focus highlights', 'Show stronger outlines when navigating by keyboard.'],
  ['alwaysVisibleScrollbars', 'Always visible scrollbars', 'Keep scrollbars on screen instead of auto-hiding.'],
] as const

export function AccessibilitySection() {
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const a11y = preferences.accessibility
  const anim = preferences.appearance.animations

  return (
    <SettingsSection title="Accessibility" description="Make Recall easier to see and operate." onReset={() => resetSection('accessibility')}>
      {TOGGLES.map(([key, label, description]) => (
        <SettingRow key={key} id={`set-${key === 'highContrast' ? 'high-contrast' : key === 'dyslexiaFriendlyFont' ? 'dyslexia-font' : key === 'largerClickTargets' ? 'large-targets' : key === 'keyboardFocusHighlights' ? 'focus-highlights' : 'scrollbars'}`} label={label} description={description} control={<SettingsToggle label={label} checked={a11y[key]} onChange={(v) => updateSection('accessibility', { [key]: v })} />} />
      ))}
      {/* Reduce motion mirrors the ONE value at appearance.animations.reduceMotion — no second source. */}
      <SettingRow id="set-reduce-motion" label="Reduce motion" description="Minimize animation and movement. Also configurable under Appearance → Animations." control={<SettingsToggle label="Reduce motion" checked={anim.reduceMotion} onChange={(v) => updateSection('appearance', { animations: { ...anim, reduceMotion: v } })} />} />
    </SettingsSection>
  )
}
