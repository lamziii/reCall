import { useRecallPreferences } from '@/settings/settings-context'
import {
  AI_RESPONSE_STYLE_OPTIONS,
  CITATION_STYLE_OPTIONS,
  SUMMARY_STYLE_OPTIONS,
  TASK_DETECTION_OPTIONS,
  TIMESTAMP_PRECISION_OPTIONS,
} from '@/settings/types'
import { SettingRow, SettingsSection, SettingsSegmented, SettingsSelect } from '../settings-controls'

export function AiSection() {
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const ai = preferences.ai
  const set = (patch: Partial<typeof ai>) => updateSection('ai', patch)

  return (
    <SettingsSection title="AI" description="How Recall's AI writes and reasons about your meetings." onReset={() => resetSection('ai')}>
      <SettingRow id="set-ai-response" label="Response style" control={<SettingsSegmented label="Response style" value={ai.responseStyle} onChange={(v) => set({ responseStyle: v })} options={AI_RESPONSE_STYLE_OPTIONS} />} />
      <SettingRow id="set-summary-style" label="Summary style" control={<SettingsSelect label="Summary style" value={ai.summaryStyle} onChange={(v) => set({ summaryStyle: v })} options={SUMMARY_STYLE_OPTIONS} />} />
      <SettingRow id="set-task-detection" label="Task detection" description="How readily Recall turns implied commitments into tasks." control={<SettingsSegmented label="Task detection" value={ai.taskDetection} onChange={(v) => set({ taskDetection: v })} options={TASK_DETECTION_OPTIONS} />} />
      <SettingRow id="set-timestamp-precision" label="Timestamp precision" control={<SettingsSelect label="Timestamp precision" value={ai.timestampPrecision} onChange={(v) => set({ timestampPrecision: v })} options={TIMESTAMP_PRECISION_OPTIONS} />} />
      <SettingRow id="set-citation" label="Citation style" description="When Recall links answers back to the transcript." control={<SettingsSelect label="Citation style" value={ai.citationStyle} onChange={(v) => set({ citationStyle: v })} options={CITATION_STYLE_OPTIONS} />} />
    </SettingsSection>
  )
}
