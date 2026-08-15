import { FlaskConical } from 'lucide-react'
import { useRecallPreferences } from '@/settings/settings-context'
import { EXPERIMENTAL_FEATURES } from '@/settings/types'
import { SettingsSection } from '../settings-controls'
import { ExperimentalFeatureRow } from '../settings-misc'

export function ExperimentalSection() {
  const { preferences, updateSection } = useRecallPreferences()

  return (
    <SettingsSection title="Experimental" description="Try features that are still being refined.">
      {EXPERIMENTAL_FEATURES.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <FlaskConical className="size-5 text-subtle-foreground" aria-hidden />
          <p className="text-small text-muted-foreground">No experimental features are available right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {EXPERIMENTAL_FEATURES.map((feature) => (
            <ExperimentalFeatureRow
              key={feature.value}
              id={feature.value}
              name={feature.label}
              description={feature.description ?? ''}
              enabled={preferences.experimental[feature.value] ?? false}
              onChange={(v) => updateSection('experimental', { ...preferences.experimental, [feature.value]: v })}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
