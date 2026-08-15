import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useToast } from '@/components/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useRecallPreferences } from '@/settings/settings-context'
import { DEFAULT_RECALL_PREFERENCES } from '@/settings/defaults'
import { buildPreferencesExport, validateImportedPreferences } from '@/settings/schema'
import type { RecallPreferences } from '@/settings/types'
import { SettingRow, SettingsSection, SettingsToggle } from '../settings-controls'
import { SettingsDangerAction } from '../settings-misc'

/** Clears only safe, regenerable cache — sessionStorage + any explicitly cache-namespaced keys.
 *  Never touches auth, preferences, theme, or workspace data. */
function clearSafeCaches() {
  try {
    window.sessionStorage.clear()
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('recall-cache')) window.localStorage.removeItem(key)
    }
  } catch {
    // storage disabled — nothing to clear
  }
}

export function AdvancedSection() {
  const { toast } = useToast()
  const { preferences, updateSection, replacePreferences, resetAll } = useRecallPreferences()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<RecallPreferences | null>(null)
  const [resetAllOpen, setResetAllOpen] = useState(false)

  function exportPreferences() {
    const payload = buildPreferencesExport(preferences)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recall-preferences-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Preferences exported' })
  }

  async function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-picking the same file
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const result = validateImportedPreferences(parsed)
      if (!result.ok) {
        toast({ title: "Couldn't import preferences", description: result.error, variant: 'danger' })
        return
      }
      setPendingImport(result.value) // confirm before applying
    } catch {
      toast({ title: "Couldn't import preferences", description: 'That file is not valid JSON.', variant: 'danger' })
    }
  }

  return (
    <SettingsSection title="Advanced" description="Technical controls and data.">
      <SettingRow
        label="Hardware acceleration"
        description="Controlled by your browser and operating system — Recall can't change it from here. Enable GPU acceleration in your browser settings if animations feel slow."
        control={<span className="text-caption text-subtle-foreground">Managed by browser</span>}
      />

      <SettingsDangerAction
        id="set-clear-cache"
        label="Clear local cache"
        description="Remove safe cached data on this device. Your account, recordings, and preferences are not affected."
        buttonLabel="Clear cache"
        confirmTitle="Clear local cache?"
        confirmDescription="This removes temporary cached data on this device only. It does not sign you out or delete any sessions, recordings, or preferences."
        confirmLabel="Clear cache"
        onConfirm={() => {
          clearSafeCaches()
          toast({ title: 'Local cache cleared' })
        }}
      />

      <SettingsDangerAction
        id="set-reset-layout"
        label="Reset layout"
        description="Restore sidebar, panels, widths, and layout preferences to their defaults."
        buttonLabel="Reset layout"
        confirmTitle="Reset layout?"
        confirmDescription="Sidebar style, AI panel position, transcript width, and UI density return to their defaults. Other settings are unchanged."
        confirmLabel="Reset layout"
        onConfirm={() => {
          const d = DEFAULT_RECALL_PREFERENCES.appearance
          updateSection('appearance', { sidebarStyle: d.sidebarStyle, density: d.density })
          updateSection('workspace', {
            aiPanelPosition: DEFAULT_RECALL_PREFERENCES.workspace.aiPanelPosition,
            transcriptWidth: DEFAULT_RECALL_PREFERENCES.workspace.transcriptWidth,
          })
          toast({ title: 'Layout reset' })
        }}
      />

      <SettingsDangerAction id="set-export" label="Export preferences" description="Download your preferences as a JSON file. Contains no account, session, or transcript data." buttonLabel="Export" buttonIcon={<Download />} requireConfirm={false} onConfirm={exportPreferences} />

      <SettingsDangerAction id="set-import" label="Import preferences" description="Load preferences from a previously exported JSON file. You'll confirm before anything changes." buttonLabel="Import" buttonIcon={<Upload />} requireConfirm={false} onConfirm={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onFilePicked} aria-hidden tabIndex={-1} />

      <SettingRow id="set-developer-mode" label="Developer mode" description="Unlock technical IDs, diagnostics, and verbose processing states (used in a later update)." control={<SettingsToggle label="Developer mode" checked={preferences.advanced.developerMode} onChange={(v) => updateSection('advanced', { developerMode: v })} />} />

      <SettingsDangerAction id="set-reset-all" label="Reset all settings" description="Restore every setting in every section to its default." buttonLabel="Reset all" variant="danger" requireConfirm={false} onConfirm={() => setResetAllOpen(true)} />

      <ConfirmDialog
        open={resetAllOpen}
        onOpenChange={setResetAllOpen}
        title="Reset all settings?"
        description="Every section returns to its defaults on all your devices. This can't be undone."
        confirmLabel="Reset everything"
        variant="danger"
        onConfirm={() => {
          resetAll()
          setResetAllOpen(false)
          toast({ title: 'All settings reset to defaults' })
        }}
      />

      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
        title="Import these preferences?"
        description="Your current preferences will be replaced with the imported file on all your devices."
        confirmLabel="Import and apply"
        onConfirm={() => {
          if (pendingImport) {
            replacePreferences(pendingImport)
            toast({ title: 'Preferences imported' })
          }
          setPendingImport(null)
        }}
      />
    </SettingsSection>
  )
}
