import { useState } from 'react'
import { Calendar, FolderKanban, LayoutGrid } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/navigation/tabs'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { Pagination } from '@/components/navigation/pagination'
import { NavigationItem } from '@/components/navigation/navigation-item'
import { Stepper } from '@/components/navigation/stepper'
import { BackButton } from '@/components/navigation/back-button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function NavigationSection() {
  const [page, setPage] = useState(4)

  return (
    <PlaygroundSection
      id="navigation"
      title="Navigation"
      description="Tabs, breadcrumb, pagination, nav rows, steppers — the wayfinding pieces every page shares."
    >
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Interactive: Tabs (arrow keys to move)</span>
        <Tabs defaultValue="summary">
          <TabList>
            <Tab value="summary">Executive Summary</Tab>
            <Tab value="decisions">Decisions</Tab>
            <Tab value="tasks">Tasks</Tab>
          </TabList>
          <TabPanel value="summary" className="text-small text-muted-foreground">
            High-level recap of what the session covered.
          </TabPanel>
          <TabPanel value="decisions" className="text-small text-muted-foreground">
            Every decision the group landed on, with owners.
          </TabPanel>
          <TabPanel value="tasks" className="text-small text-muted-foreground">
            Action items extracted from the conversation.
          </TabPanel>
        </Tabs>
      </div>

      <PlaygroundRow label="Breadcrumb">
        <Breadcrumb items={[{ label: 'Workspace', href: '#' }, { label: 'Projects', href: '#' }, { label: 'Apollo Launch' }]} />
      </PlaygroundRow>

      <PlaygroundRow label="Pagination">
        <Pagination page={page} pageCount={12} onPageChange={setPage} />
      </PlaygroundRow>

      <PlaygroundRow label="BackButton">
        <BackButton label="Back to sessions" />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">NavigationItem</span>
        <div className="flex w-56 flex-col gap-0.5 rounded-lg border border-border bg-surface p-2">
          <NavigationItem icon={<LayoutGrid />} label="Home" active />
          <NavigationItem icon={<FolderKanban />} label="Projects" count={9} />
          <NavigationItem icon={<Calendar />} label="Calendar" disabled />
        </div>
        <div className="flex w-14 flex-col gap-0.5 rounded-lg border border-border bg-surface p-2">
          <NavigationItem icon={<LayoutGrid />} label="Home" active collapsed />
          <NavigationItem icon={<FolderKanban />} label="Projects" collapsed />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Stepper</span>
        <Stepper
          orientation="horizontal"
          steps={[
            { id: 'record', label: 'Record', status: 'completed' },
            { id: 'process', label: 'Process', status: 'completed' },
            { id: 'review', label: 'Review', status: 'current', description: 'Needs your input' },
            { id: 'publish', label: 'Publish', status: 'pending' },
          ]}
        />
        <Stepper
          orientation="vertical"
          steps={[
            { id: 'record', label: 'Record', status: 'completed' },
            { id: 'process', label: 'Process', status: 'error', description: 'Transcription failed' },
            { id: 'review', label: 'Review', status: 'pending' },
          ]}
          className="w-56"
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Scroll area</span>
        <ScrollArea className="h-32 w-64 rounded-lg border border-border bg-surface p-3">
          <div className="flex flex-col gap-2 text-small text-muted-foreground">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>Scrollable row {i + 1}</p>
            ))}
          </div>
        </ScrollArea>
      </div>
    </PlaygroundSection>
  )
}
