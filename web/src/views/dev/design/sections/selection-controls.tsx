import { useState } from 'react'
import { LayoutGrid, List as ListIcon, Kanban } from 'lucide-react'
import { Select } from '@/components/forms/select'
import { Combobox } from '@/components/forms/combobox'
import { Checkbox } from '@/components/forms/checkbox'
import { CheckboxGroup } from '@/components/forms/checkbox-group'
import { Radio, RadioGroup } from '@/components/forms/radio'
import { Switch } from '@/components/forms/switch'
import { Slider } from '@/components/forms/slider'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

const PROJECT_OPTIONS = [
  { value: 'apollo', label: 'Apollo Launch' },
  { value: 'onboarding', label: 'Onboarding Redesign' },
  { value: 'pricing', label: 'Pricing Model Review' },
  { value: 'q3-roadmap', label: 'Q3 Roadmap' },
]

function CheckboxIndeterminatePlayground() {
  const [checked, setChecked] = useState([true, false, false])
  const allChecked = checked.every(Boolean)
  const someChecked = checked.some(Boolean) && !allChecked

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        label="Select all decisions"
        checked={allChecked}
        indeterminate={someChecked}
        onChange={(e) => setChecked(checked.map(() => e.target.checked))}
      />
      <div className="ml-6 flex flex-col gap-2 border-l border-border-subtle pl-3">
        {['Ship pricing update', 'Approve onboarding copy', 'Archive old roadmap'].map((label, i) => (
          <Checkbox
            key={label}
            label={label}
            checked={checked[i]}
            onChange={(e) =>
              setChecked((current) => current.map((v, idx) => (idx === i ? e.target.checked : v)))
            }
          />
        ))}
      </div>
    </div>
  )
}

function SwitchPlayground() {
  const [enabled, setEnabled] = useState(true)
  return <Switch label="Auto-record new meetings" description={enabled ? 'Recording will start automatically' : 'Off'} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
}

export function SelectionControlsSection() {
  const [combo, setCombo] = useState<string>()
  const [view, setView] = useState('list')
  const [confidence, setConfidence] = useState(72)

  return (
    <PlaygroundSection
      id="selection-controls"
      title="Selection controls"
      description="Select, Combobox, Checkbox, Radio, Switch, SegmentedControl, and Slider."
    >
      <PlaygroundRow label="Select">
        <Select options={PROJECT_OPTIONS} placeholder="Choose a project" className="w-56" />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Interactive: Combobox filtering</span>
        <Combobox options={PROJECT_OPTIONS} value={combo} onChange={setCombo} placeholder="Search projects..." className="w-64" />
      </div>

      <PlaygroundRow label="Checkbox">
        <Checkbox label="Default" defaultChecked />
        <Checkbox label="Unchecked" />
        <Checkbox label="Indeterminate" indeterminate />
        <Checkbox label="Disabled" disabled />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Interactive: indeterminate parent</span>
        <CheckboxIndeterminatePlayground />
      </div>

      <PlaygroundRow label="CheckboxGroup">
        <CheckboxGroup label="Notify me about" orientation="horizontal">
          <Checkbox label="New decisions" defaultChecked />
          <Checkbox label="Task assignments" defaultChecked />
          <Checkbox label="Weekly digest" />
        </CheckboxGroup>
      </PlaygroundRow>

      <PlaygroundRow label="Radio">
        <RadioGroup name="playground-radio" className="flex-row gap-4">
          <Radio label="Everyone" defaultChecked />
          <Radio label="Team only" />
          <Radio label="Only me" disabled />
        </RadioGroup>
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Interactive: Switch</span>
        <SwitchPlayground />
      </div>

      <PlaygroundRow label="SegmentedControl">
        <SegmentedControl
          aria-label="View"
          options={[
            { value: 'list', label: 'List', icon: <ListIcon /> },
            { value: 'grid', label: 'Grid', icon: <LayoutGrid /> },
            { value: 'board', label: 'Board', icon: <Kanban /> },
          ]}
          value={view}
          onChange={setView}
        />
      </PlaygroundRow>

      <PlaygroundRow label="Slider">
        <Slider value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-56" />
        <span className="font-mono text-caption tabular-nums text-muted-foreground">{confidence}%</span>
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
