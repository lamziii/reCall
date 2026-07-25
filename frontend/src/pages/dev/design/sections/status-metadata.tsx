import { Sparkles, Users, FolderKanban } from 'lucide-react'
import { Badge } from '@/components/data-display/badge'
import { StatusBadge } from '@/components/data-display/status-badge'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { PriorityIndicator } from '@/components/data-display/priority-indicator'
import { StatusDot } from '@/components/data-display/status-dot'
import { Tag } from '@/components/data-display/tag'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { MetadataRow } from '@/components/data-display/metadata-row'
import { KeyValue } from '@/components/data-display/key-value'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function StatusMetadataSection() {
  return (
    <PlaygroundSection
      id="status-metadata"
      title="Status and metadata"
      description="Badges, dots, priority marks, and the small label/value rows that describe an object at a glance."
    >
      <PlaygroundRow label="Badge">
        <Badge>Default</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="accent" icon={<Sparkles />}>
          With icon
        </Badge>
      </PlaygroundRow>

      <PlaygroundRow label="Badge sizes, dismissible, interactive">
        <Badge className="text-[10px]">xs</Badge>
        <Badge>sm (default)</Badge>
        <Tag onRemove={() => {}}>Dismissible</Tag>
      </PlaygroundRow>

      <PlaygroundRow label="StatusBadge">
        <StatusBadge tone="neutral" label="Draft" />
        <StatusBadge tone="info" label="In progress" />
        <StatusBadge tone="success" label="Done" />
        <StatusBadge tone="warning" label="Needs review" />
        <StatusBadge tone="danger" label="Failed" />
      </PlaygroundRow>

      <PlaygroundRow label="StatusDot">
        <StatusDot state="neutral" label="Neutral" />
        <StatusDot state="active" label="Active" />
        <StatusDot state="processing" label="Processing" />
        <StatusDot state="success" label="Success" />
        <StatusDot state="warning" label="Warning" />
        <StatusDot state="danger" label="Danger" />
        <StatusDot state="offline" label="Offline" />
      </PlaygroundRow>

      <PlaygroundRow label="PriorityBadge (with label)">
        <PriorityBadge priority="low" />
        <PriorityBadge priority="medium" />
        <PriorityBadge priority="high" />
        <PriorityBadge priority="urgent" />
      </PlaygroundRow>

      <PlaygroundRow label="PriorityIndicator (icon-only, for dense rows)">
        <PriorityIndicator priority="none" />
        <PriorityIndicator priority="low" />
        <PriorityIndicator priority="medium" />
        <PriorityIndicator priority="high" />
        <PriorityIndicator priority="urgent" />
      </PlaygroundRow>

      <PlaygroundRow label="Tag / Chip">
        <Tag>Design</Tag>
        <Tag>Engineering</Tag>
        <Tag onRemove={() => {}}>Removable</Tag>
      </PlaygroundRow>

      <PlaygroundRow label="KeyboardShortcut">
        <KeyboardShortcut keys={['⌘', 'K']} />
        <KeyboardShortcut keys={['⌘', 'Shift', 'P']} />
        <KeyboardShortcut keys={['Esc']} />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">MetadataRow</span>
        <div className="flex w-80 flex-col gap-1 rounded-lg border border-border bg-surface p-3">
          <MetadataRow icon={<FolderKanban />} label="Project" value="Apollo Launch" />
          <MetadataRow icon={<Users />} label="Participants" value="6 people" />
        </div>
      </div>

      <PlaygroundRow label="KeyValue">
        <KeyValue variant="stacked" label="Status" value="Ready" />
        <KeyValue variant="inline" label="Duration" value="42 min" />
        <KeyValue variant="compact" label="Confidence" value="94%" />
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
