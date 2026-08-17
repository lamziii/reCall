import { useRecallPreferences } from '@/settings/settings-context'
import {
  NOTES_CODE_THEME_OPTIONS,
  NOTES_EDITOR_WIDTH_OPTIONS,
  NOTES_LINE_HEIGHT_OPTIONS,
  NOTES_PAPER_STYLE_OPTIONS,
  NOTES_TABLE_SIZE_OPTIONS,
  NOTES_TEXT_SIZE_OPTIONS,
} from '@/settings/types'
import { Select } from '@/components/forms/select'
import { SettingRow, SettingsSection, SettingsSegmented, SettingsSelect, SettingsToggle } from '../settings-controls'

export function NotesSection() {
  const { preferences, updateSection, resetSection } = useRecallPreferences()
  const n = preferences.notes
  const set = (patch: Partial<typeof n>) => updateSection('notes', patch)

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Editor" description="How the notes editor reads and feels." onReset={() => resetSection('notes')}>
        <SettingRow id="notes-editor-width" label="Editor width" control={<SettingsSelect label="Editor width" value={n.editorWidth} onChange={(v) => set({ editorWidth: v })} options={NOTES_EDITOR_WIDTH_OPTIONS} />} />
        <SettingRow id="notes-text-size" label="Text size" control={<SettingsSegmented label="Text size" value={n.textSize} onChange={(v) => set({ textSize: v })} options={NOTES_TEXT_SIZE_OPTIONS} />} />
        <SettingRow id="notes-line-height" label="Line height" control={<SettingsSegmented label="Line height" value={n.lineHeight} onChange={(v) => set({ lineHeight: v })} options={NOTES_LINE_HEIGHT_OPTIONS} />} />
        <SettingRow id="notes-paper-style" label="Default page style" description="Background for new personal notes. Existing notes keep their own." control={<SettingsSelect label="Default page style" value={n.defaultPaperStyle} onChange={(v) => set({ defaultPaperStyle: v })} options={NOTES_PAPER_STYLE_OPTIONS} />} />
      </SettingsSection>

      <SettingsSection title="Behavior" description="Editing shortcuts and meeting-note extras.">
        <SettingRow id="notes-slash" label="Slash commands" description="Type “/” to insert blocks." control={<SettingsToggle label="Slash commands" checked={n.slashCommands} onChange={(v) => set({ slashCommands: v })} />} />
        <SettingRow id="notes-markdown" label="Markdown shortcuts" description="e.g. “## ” for a heading, “- ” for a list." control={<SettingsToggle label="Markdown shortcuts" checked={n.markdownShortcuts} onChange={(v) => set({ markdownShortcuts: v })} />} />
        <SettingRow id="notes-spellcheck" label="Spellcheck" control={<SettingsToggle label="Spellcheck" checked={n.spellcheck} onChange={(v) => set({ spellcheck: v })} />} />
        <SettingRow id="notes-timestamps" label="Show meeting timestamps" description="Show captured timestamps on marked moments in meeting notes." control={<SettingsToggle label="Show meeting timestamps" checked={n.showMeetingTimestamps} onChange={(v) => set({ showMeetingTimestamps: v })} />} />
        <SettingRow id="notes-moments" label="Show marked moments" control={<SettingsToggle label="Show marked moments" checked={n.showMarkedMoments} onChange={(v) => set({ showMarkedMoments: v })} />} />
      </SettingsSection>

      <SettingsSection title="Code">
        <SettingRow id="notes-code-theme" label="Code theme" description="Force the code block palette, or follow the app theme." control={<SettingsSegmented label="Code theme" value={n.codeTheme} onChange={(v) => set({ codeTheme: v })} options={NOTES_CODE_THEME_OPTIONS} />} />
        <SettingRow id="notes-code-lang" label="Show language selector" control={<SettingsToggle label="Show language selector" checked={n.showCodeLanguageSelector} onChange={(v) => set({ showCodeLanguageSelector: v })} />} />
        <SettingRow id="notes-code-copy" label="Show Copy button" control={<SettingsToggle label="Show Copy button" checked={n.showCopyButton} onChange={(v) => set({ showCopyButton: v })} />} />
      </SettingsSection>

      <SettingsSection title="Tables">
        <SettingRow
          id="notes-table-size"
          label="Default table size"
          description="Size of a table inserted via “/table”. You can always add or remove rows and columns afterward."
          control={
            <Select
              aria-label="Default table size"
              size="sm"
              value={String(n.defaultTableSize)}
              onChange={(e) => set({ defaultTableSize: Number(e.target.value) as (typeof NOTES_TABLE_SIZE_OPTIONS)[number] })}
              options={NOTES_TABLE_SIZE_OPTIONS.map((s) => ({ value: String(s), label: `${s} × ${s}` }))}
              className="min-w-28"
            />
          }
        />
      </SettingsSection>
    </div>
  )
}
