import { useState } from 'react'
import { Copy, Download, Plus, Trash2, ChevronRight, Archive } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/button'
import { ButtonGroup, SplitButton } from '@/components/buttons'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

function LoadingPlayground() {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)
    setTimeout(() => setLoading(false), 1800)
  }

  return (
    <Button loading={loading} onClick={handleClick}>
      {loading ? 'Saving...' : 'Save changes'}
    </Button>
  )
}

export function ButtonsSection() {
  return (
    <PlaygroundSection id="buttons" title="Buttons" description="One typed Button covering every variant, size, and state — plus grouping and split-button composition.">
      <PlaygroundRow label="Variant">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="text">Text</Button>
        <Button variant="link">Link</Button>
      </PlaygroundRow>

      <PlaygroundRow label="Size">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </PlaygroundRow>

      <PlaygroundRow label="With icon">
        <Button leftIcon={<Plus />}>New session</Button>
        <Button variant="secondary" rightIcon={<ChevronRight />}>
          Continue
        </Button>
        <Button variant="danger" leftIcon={<Trash2 />}>
          Delete
        </Button>
      </PlaygroundRow>

      <PlaygroundRow label="State">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </PlaygroundRow>

      <PlaygroundRow label="Full width">
        <Button fullWidth className="max-w-xs">
          Full width
        </Button>
      </PlaygroundRow>

      <PlaygroundRow label="Interactive: loading state">
        <LoadingPlayground />
      </PlaygroundRow>

      <PlaygroundRow label="Icon button (xs / sm / md / lg)">
        <IconButton icon={<Plus />} label="Add item" variant="primary" size="xs" />
        <IconButton icon={<Trash2 />} label="Delete" variant="secondary" size="sm" />
        <IconButton icon={<ChevronRight />} label="Next" variant="ghost" size="md" />
        <IconButton icon={<Download />} label="Download" variant="outline" size="lg" />
        <IconButton icon={<Plus />} label="Loading" loading />
      </PlaygroundRow>

      <PlaygroundRow label="ButtonGroup — spaced, wraps on small screens">
        <ButtonGroup wrap>
          <Button variant="secondary" size="sm">Day</Button>
          <Button variant="secondary" size="sm">Week</Button>
          <Button variant="secondary" size="sm">Month</Button>
        </ButtonGroup>
      </PlaygroundRow>

      <PlaygroundRow label="ButtonGroup — attached (segmented)">
        <ButtonGroup attached>
          <IconButton icon={<Copy />} label="Copy" variant="secondary" />
          <IconButton icon={<Archive />} label="Archive" variant="secondary" />
          <IconButton icon={<Trash2 />} label="Delete" variant="secondary" />
        </ButtonGroup>
      </PlaygroundRow>

      <PlaygroundRow label="SplitButton">
        <SplitButton
          onClick={() => {}}
          actions={[
            { id: 'duplicate', label: 'Duplicate session', icon: <Copy />, onSelect: () => {} },
            { id: 'archive', label: 'Archive session', icon: <Archive />, onSelect: () => {} },
            { id: 'delete', label: 'Delete session', icon: <Trash2 />, danger: true, onSelect: () => {} },
          ]}
        >
          Export transcript
        </SplitButton>
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
