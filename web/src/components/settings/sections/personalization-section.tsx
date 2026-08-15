import { useAuth } from '@/lib/auth/auth-context'
import { useRecallPreferences } from '@/settings/settings-context'
import { AVATAR_STYLE_OPTIONS, DATE_FORMAT_OPTIONS, GREETING_OPTIONS, LANGUAGE_OPTIONS, TIME_FORMAT_OPTIONS } from '@/settings/types'
import { SettingRow, SettingsSection, SettingsSegmented, SettingsSelect } from '../settings-controls'

export function PersonalizationSection() {
  const { user } = useAuth()
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const pers = preferences.personalization
  const set = (patch: Partial<typeof pers>) => updateSection('personalization', patch)

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'
  const greetingExample = pers.greeting === 'personalized' ? `Good morning, ${firstName}` : 'Home'

  return (
    <SettingsSection title="Personalization" description="Make Recall feel like yours." onReset={() => resetSection('personalization')}>
      <SettingRow id="set-avatar" label="Avatar style" control={<SettingsSegmented label="Avatar style" value={pers.avatarStyle} onChange={(v) => set({ avatarStyle: v })} options={AVATAR_STYLE_OPTIONS} />} />
      <SettingRow id="set-greeting" label="Greeting" description={`Home shows: “${greetingExample}”`} control={<SettingsSegmented label="Greeting" value={pers.greeting} onChange={(v) => set({ greeting: v })} options={GREETING_OPTIONS} />} />
      <SettingRow id="set-date-format" label="Date format" control={<SettingsSelect label="Date format" value={pers.dateFormat} onChange={(v) => set({ dateFormat: v })} options={DATE_FORMAT_OPTIONS} />} />
      <SettingRow id="set-time-format" label="Time format" control={<SettingsSegmented label="Time format" value={pers.timeFormat} onChange={(v) => set({ timeFormat: v })} options={TIME_FORMAT_OPTIONS} />} />
      <SettingRow id="set-language" label="Language" description="More languages will appear here as translations land." control={<SettingsSelect label="Language" value={pers.language} onChange={(v) => set({ language: v })} options={LANGUAGE_OPTIONS} />} />
    </SettingsSection>
  )
}
