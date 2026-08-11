import { useRecallPreferences } from '@/settings/settings-context'
import {
  AI_PANEL_POSITION_OPTIONS,
  LANDING_PAGE_OPTIONS,
  SESSION_VIEW_OPTIONS,
  TRANSCRIPT_WIDTH_OPTIONS,
} from '@/settings/types'
import { SettingRow, SettingsSection, SettingsSegmented, SettingsSelect, SettingsToggle } from '../settings-controls'

const AUTO_COLLAPSE_ROWS = [
  ['decisions', 'Decisions'],
  ['risks', 'Risks'],
  ['documents', 'Documents'],
  ['timeline', 'Timeline'],
] as const

export function WorkspaceSection() {
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const w = preferences.workspace
  const set = (patch: Partial<typeof w>) => updateSection('workspace', patch)

  return (
    <SettingsSection title="Workspace" description="Defaults for how Recall opens and lays out your work." onReset={() => resetSection('workspace')}>
      <SettingRow id="set-landing" label="Default landing page" description="Where Recall opens." control={<SettingsSelect label="Default landing page" value={w.landingPage} onChange={(v) => set({ landingPage: v })} options={LANDING_PAGE_OPTIONS} />} />
      <SettingRow id="set-session-view" label="Default session view" description="Which tab opens when you enter a session." control={<SettingsSelect label="Default session view" value={w.defaultSessionView} onChange={(v) => set({ defaultSessionView: v })} options={SESSION_VIEW_OPTIONS} />} />
      <SettingRow id="set-ai-panel" label="AI panel position" control={<SettingsSegmented label="AI panel position" value={w.aiPanelPosition} onChange={(v) => set({ aiPanelPosition: v })} options={AI_PANEL_POSITION_OPTIONS} />} />
      <SettingRow id="set-transcript-width" label="Transcript width" control={<SettingsSegmented label="Transcript width" value={w.transcriptWidth} onChange={(v) => set({ transcriptWidth: v })} options={TRANSCRIPT_WIDTH_OPTIONS} />} />
      <SettingRow id="set-auto-collapse" label="Auto collapse sections" description="Which session sections start collapsed." align="start">
        <div className="mt-3 flex flex-col gap-2.5">
          {AUTO_COLLAPSE_ROWS.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <span className="text-caption text-muted-foreground">{label}</span>
              <SettingsToggle label={label} checked={w.autoCollapse[key]} onChange={(v) => set({ autoCollapse: { ...w.autoCollapse, [key]: v } })} />
            </label>
          ))}
        </div>
      </SettingRow>
    </SettingsSection>
  )
}
