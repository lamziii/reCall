import { useTheme, type ThemePreference } from '@/app/theme/theme-provider'
import { useRecallPreferences } from '@/settings/settings-context'
import {
  ACCENT_OPTIONS,
  CODE_THEME_OPTIONS,
  DASHBOARD_LAYOUT_OPTIONS,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  ICON_STYLE_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  RADIUS_OPTIONS,
  SESSION_DENSITY_OPTIONS,
  SHADOW_OPTIONS,
  SIDEBAR_STYLE_OPTIONS,
  TEXT_SIZE_OPTIONS,
} from '@/settings/types'
import { SettingRow, SettingsSection, SettingsSegmented, SettingsSelect, SettingsToggle } from '../settings-controls'
import { SettingsColorSelector, SettingsPreviewSelector, type PreviewOption } from '../settings-selectors'

/* Tiny monochrome schematics — deliberately small, no color. */
function Schematic({ children }: { children: React.ReactNode }) {
  return <span className="flex h-11 w-full items-stretch gap-1 p-1.5">{children}</span>
}
function Bar({ w }: { w: string }) {
  return <span className="block h-1 rounded-full bg-border-strong" style={{ width: w }} />
}

const THEME_OPTIONS: PreviewOption<ThemePreference>[] = [
  { value: 'system', label: 'System', preview: <span className="size-8 rounded-full bg-gradient-to-r from-neutral-200 to-neutral-800" /> },
  { value: 'light', label: 'Light', preview: <span className="flex size-full items-center justify-center"><span className="h-8 w-11 rounded-sm border border-border bg-neutral-100" /></span> },
  { value: 'dark', label: 'Dark', preview: <span className="flex size-full items-center justify-center"><span className="h-8 w-11 rounded-sm border border-border bg-neutral-900" /></span> },
  { value: 'midnight', label: 'Midnight', preview: <span className="flex size-full items-center justify-center"><span className="h-8 w-11 rounded-sm border border-border bg-black" /></span> },
]

const SIDEBAR_PREVIEWS: PreviewOption<(typeof SIDEBAR_STYLE_OPTIONS)[number]['value']>[] = SIDEBAR_STYLE_OPTIONS.map((o) => ({
  ...o,
  preview: (
    <Schematic>
      <span className={o.value === 'compact' ? 'w-2 rounded-sm bg-surface-active' : o.value === 'expanded' ? 'w-6 rounded-sm bg-surface-active' : 'w-4 rounded-sm bg-surface-active'} style={o.value === 'floating' ? { margin: 2 } : undefined} />
      <span className="flex flex-1 flex-col justify-center gap-1 pl-1">
        <Bar w="80%" />
        <Bar w="60%" />
      </span>
    </Schematic>
  ),
}))

const RADIUS_PREVIEWS: PreviewOption<(typeof RADIUS_OPTIONS)[number]['value']>[] = RADIUS_OPTIONS.map((o) => ({
  ...o,
  preview: <span className={`size-8 border border-border-strong bg-surface-active ${o.value === 'sharp' ? 'rounded-none' : o.value === 'subtle' ? 'rounded-md' : 'rounded-xl'}`} />,
}))

const DASHBOARD_PREVIEWS: PreviewOption<(typeof DASHBOARD_LAYOUT_OPTIONS)[number]['value']>[] = DASHBOARD_LAYOUT_OPTIONS.map((o) => ({
  ...o,
  preview: (
    <Schematic>
      {o.value === 'cards' ? (
        <span className="grid w-full grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="rounded-sm bg-surface-active" />
          ))}
        </span>
      ) : o.value === 'lists' ? (
        <span className="flex w-full flex-col justify-center gap-1">
          <Bar w="100%" />
          <Bar w="100%" />
          <Bar w="80%" />
        </span>
      ) : (
        <span className="flex w-full gap-1">
          <span className="flex-1 rounded-sm bg-surface-active" />
          <span className="flex w-1/2 flex-col gap-1 py-0.5">
            <Bar w="100%" />
            <Bar w="70%" />
          </span>
        </span>
      )}
    </Schematic>
  ),
}))

export function AppearanceSection() {
  const { preference, setPreference } = useTheme()
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const a = preferences.appearance
  const setAppearance = (patch: Partial<typeof a>) => updateSection('appearance', patch)

  return (
    <SettingsSection title="Appearance" description="Tune how Recall looks on this device." onReset={() => resetSection('appearance')}>
      <SettingRow id="set-theme" label="Theme" description="System follows your OS. Midnight is a near-black OLED variant." align="start">
        <div className="mt-3 w-full max-w-md">
          <SettingsPreviewSelector label="Theme" value={preference} onChange={setPreference} options={THEME_OPTIONS} columns={4} />
        </div>
      </SettingRow>

      <SettingRow id="set-accent" label="Accent color" description="The single accent used across the interface." align="start">
        <div className="mt-3">
          <SettingsColorSelector label="Accent color" value={a.accentColor} onChange={(v) => setAppearance({ accentColor: v })} options={ACCENT_OPTIONS} />
        </div>
      </SettingRow>

      <SettingRow id="set-sidebar-style" label="Sidebar style" align="start">
        <div className="mt-3 w-full max-w-md">
          <SettingsPreviewSelector label="Sidebar style" value={a.sidebarStyle} onChange={(v) => setAppearance({ sidebarStyle: v })} options={SIDEBAR_PREVIEWS} columns={4} />
        </div>
      </SettingRow>

      <SettingRow id="set-density" label="UI density" description="Adjust spacing and row height throughout Recall." control={<SettingsSegmented label="UI density" value={a.density} onChange={(v) => setAppearance({ density: v })} options={DENSITY_OPTIONS} />} />

      <SettingRow id="set-radius" label="Border radius" align="start">
        <div className="mt-3 w-full max-w-xs">
          <SettingsPreviewSelector label="Border radius" value={a.radius} onChange={(v) => setAppearance({ radius: v })} options={RADIUS_PREVIEWS} columns={3} />
        </div>
      </SettingRow>

      <SettingRow id="set-glass" label="Glass effect" description="Subtle transparency and blur on supported surfaces." control={<SettingsToggle label="Glass effect" checked={a.glassEffect} onChange={(v) => setAppearance({ glassEffect: v })} />} />

      <SettingRow id="set-shadows" label="Shadows" control={<SettingsSegmented label="Shadows" value={a.shadows} onChange={(v) => setAppearance({ shadows: v })} options={SHADOW_OPTIONS} />} />

      <SettingRow id="set-animations" label="Animations" description="Motion throughout Recall." control={<SettingsToggle label="Animations" checked={a.animations.enabled} onChange={(v) => setAppearance({ animations: { ...a.animations, enabled: v } })} />}>
        <div className="mt-3 flex flex-col gap-2.5 border-l border-border-subtle pl-4">
          {(
            [
              ['reduceMotion', 'Reduce motion'],
              ['pageTransitions', 'Page transitions'],
              ['hoverAnimations', 'Hover animations'],
              ['decorativeEffects', 'Decorative effects'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <span className="text-caption text-muted-foreground">{label}</span>
              <SettingsToggle
                label={label}
                disabled={!a.animations.enabled && key !== 'reduceMotion'}
                checked={key === 'reduceMotion' ? a.animations.reduceMotion : a.animations.enabled && a.animations[key]}
                onChange={(v) => setAppearance({ animations: { ...a.animations, [key]: v } })}
              />
            </label>
          ))}
        </div>
      </SettingRow>

      <SettingRow id="set-typography" label="Typography" description="Font, text size, and line height." align="start">
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-caption text-muted-foreground">Font</span>
            <SettingsSegmented label="Font" value={a.typography.font} onChange={(v) => setAppearance({ typography: { ...a.typography, font: v } })} options={FONT_OPTIONS} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-caption text-muted-foreground">Text size</span>
            <SettingsSegmented label="Text size" value={a.typography.size} onChange={(v) => setAppearance({ typography: { ...a.typography, size: v } })} options={TEXT_SIZE_OPTIONS} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-caption text-muted-foreground">Line height</span>
            <SettingsSegmented label="Line height" value={a.typography.lineHeight} onChange={(v) => setAppearance({ typography: { ...a.typography, lineHeight: v } })} options={LINE_HEIGHT_OPTIONS} />
          </div>
        </div>
      </SettingRow>

      <SettingRow id="set-icon-style" label="Sidebar icon style" control={<SettingsSegmented label="Sidebar icon style" value={a.sidebarIconStyle} onChange={(v) => setAppearance({ sidebarIconStyle: v })} options={ICON_STYLE_OPTIONS} />} />

      <SettingRow id="set-dashboard-layout" label="Dashboard layout" align="start">
        <div className="mt-3 w-full max-w-xs">
          <SettingsPreviewSelector label="Dashboard layout" value={a.dashboardLayout} onChange={(v) => setAppearance({ dashboardLayout: v })} options={DASHBOARD_PREVIEWS} columns={3} />
        </div>
      </SettingRow>

      <SettingRow id="set-session-density" label="Session density" description="How session content and transcript blocks are presented." control={<SettingsSegmented label="Session density" value={a.sessionDensity} onChange={(v) => setAppearance({ sessionDensity: v })} options={SESSION_DENSITY_OPTIONS} />} />

      <SettingRow id="set-code-theme" label="Code block theme" description="For technical sessions." control={<SettingsSelect label="Code block theme" value={a.codeBlockTheme} onChange={(v) => setAppearance({ codeBlockTheme: v })} options={CODE_THEME_OPTIONS} />} />
    </SettingsSection>
  )
}
