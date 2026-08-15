import { ChevronDown, ChevronUp } from 'lucide-react'
import { IconButton } from '@/components/ui/button'
import { Switch } from '@/components/forms/switch'
import { QUICK_ACTIONS, type QuickActionPreference } from '@/settings/types'

const LABELS = new Map(QUICK_ACTIONS.map((a) => [a.value, a.label]))

/** Reorderable (up/down) + enable/disable list of quick actions. No drag-and-drop dependency —
 *  the project has none and this doesn't warrant adding one. */
export function QuickActionsEditor({
  value,
  onChange,
}: {
  value: QuickActionPreference[]
  onChange: (next: QuickActionPreference[]) => void
}) {
  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= value.length) return
    const next = value.slice()
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function toggle(index: number, enabled: boolean) {
    const next = value.slice()
    next[index] = { ...next[index], enabled }
    onChange(next)
  }

  return (
    <ul className="flex flex-col divide-y divide-border-subtle rounded-md border border-border">
      {value.map((action, index) => (
        <li key={action.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-1">
            <IconButton
              variant="ghost"
              size="xs"
              icon={<ChevronUp />}
              label={`Move ${LABELS.get(action.id)} up`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            />
            <IconButton
              variant="ghost"
              size="xs"
              icon={<ChevronDown />}
              label={`Move ${LABELS.get(action.id)} down`}
              disabled={index === value.length - 1}
              onClick={() => move(index, 1)}
            />
            <span className="ml-1 text-small text-foreground">{LABELS.get(action.id) ?? action.id}</span>
          </div>
          <Switch checked={action.enabled} aria-label={`Enable ${LABELS.get(action.id)}`} onChange={(e) => toggle(index, e.target.checked)} />
        </li>
      ))}
    </ul>
  )
}
