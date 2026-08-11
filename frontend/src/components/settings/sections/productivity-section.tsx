import { useRecallPreferences } from '@/settings/settings-context'
import { RECENT_COUNT_OPTIONS, type RecentCount } from '@/settings/types'
import { SettingRow, SettingsSection, SettingsSegmented, SettingsToggle } from '../settings-controls'
import { QuickActionsEditor } from '../quick-actions-editor'

const RECENT_COUNT_SEGMENTS = RECENT_COUNT_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))

export function ProductivitySection() {
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const p = preferences.productivity
  const set = (patch: Partial<typeof p>) => updateSection('productivity', patch)

  return (
    <SettingsSection title="Productivity" description="Small behaviors that speed up your day." onReset={() => resetSection('productivity')}>
      <SettingRow id="set-auto-expand" label="Auto expand latest session" description="Open your most recently active session when returning to Recall." control={<SettingsToggle label="Auto expand latest session" checked={p.autoExpandLatestSession} onChange={(v) => set({ autoExpandLatestSession: v })} />} />
      <SettingRow id="set-auto-resume" label="Auto resume recording" description="Attempt to recover unfinished recordings after a refresh or crash. Best effort, not a guarantee." control={<SettingsToggle label="Auto resume recording" checked={p.autoResumeRecording} onChange={(v) => set({ autoResumeRecording: v })} />} />
      <SettingRow id="set-remember-filters" label="Remember last filters" description="Keep your filters and sorting when returning to lists." control={<SettingsToggle label="Remember last filters" checked={p.rememberLastFilters} onChange={(v) => set({ rememberLastFilters: v })} />} />
      <SettingRow
        id="set-recent-count"
        label="Recently opened count"
        description="How many recent items to keep."
        control={<SettingsSegmented label="Recently opened count" value={String(p.recentlyOpenedCount)} onChange={(v) => set({ recentlyOpenedCount: Number(v) as RecentCount })} options={RECENT_COUNT_SEGMENTS} />}
      />
      <SettingRow id="set-quick-actions" label="Quick actions" description="Choose which quick actions appear, and their order." align="start">
        <div className="mt-3 w-full max-w-sm">
          <QuickActionsEditor value={p.quickActions} onChange={(next) => set({ quickActions: next })} />
        </div>
      </SettingRow>
    </SettingsSection>
  )
}
