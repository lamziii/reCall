import { Clock, FileText, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/status-badge'
import { Badge } from '@/components/data-display/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardActions } from '@/components/data-display/card'
import { Stat } from '@/components/data-display/stat'
import { Metric } from '@/components/data-display/metric'
import { List, ListItem } from '@/components/data-display/list'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/data-display/table'
import { DataTable } from '@/components/data-display/data-table'
import { Timeline, TimelineItem } from '@/components/data-display/timeline'
import { Quote } from '@/components/data-display/quote'
import { CodeBlock } from '@/components/data-display/code-block'
import { TruncatedContent } from '@/components/data-display/truncated-content'
import { CopyButton } from '@/components/data-display/copy-button'
import { Button } from '@/components/ui/button'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

interface Row {
  id: string
  name: string
  status: string
  updated: string
}

const ROWS: Row[] = [
  { id: '1', name: 'Q3 Product Strategy Sync', status: 'Done', updated: '2h ago' },
  { id: '2', name: 'Product Design Review', status: 'In progress', updated: '1d ago' },
  { id: '3', name: 'Apollo Launch kickoff', status: 'Scheduled', updated: '3d ago' },
]

export function DataDisplaySection() {
  return (
    <PlaygroundSection
      id="data-display"
      title="Data display"
      description="Cards, tables, lists, timelines, and the small content blocks — quotes, code, copy — used inside them."
    >
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Card</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Q3 Product Strategy Sync</CardTitle>
              <CardDescription>Recorded 2 hours ago · 6 participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-small text-muted-foreground">
                <FileText className="size-4" />
                12 decisions captured
              </div>
            </CardContent>
            <CardFooter>
              <StatusBadge tone="success" label="Ready" />
              <CardActions>
                <Button size="sm" variant="secondary">
                  Open
                </Button>
              </CardActions>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Metric label="Sessions this week" value="18" icon={<Clock />} trend={{ direction: 'up', value: '12%' }} />
            <Metric label="Tasks closed" value="42" icon={<CheckCircle2 />} trend={{ direction: 'down', value: '4%' }} />
          </div>
        </div>
      </div>

      <PlaygroundRow label="Stat">
        <Stat label="Total sessions" value="128" />
        <Stat label="Active projects" value="9" />
        <Stat label="Team members" value="14" />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">List</span>
        <div className="w-full max-w-md rounded-xl border border-border">
          <List>
            <ListItem leading={<FileText />} trailing={<Badge variant="accent">New</Badge>} interactive>
              Q3 Product Strategy Sync
            </ListItem>
            <ListItem leading={<FileText />} interactive selected>
              Product Design Review
            </ListItem>
            <ListItem leading={<FileText />} interactive>
              Apollo Launch kickoff
            </ListItem>
          </List>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Table (compact / standard / spacious via cell padding)</span>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="text-muted-foreground">{row.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">DataTable (sortable, click a header)</span>
        <DataTable
          columns={[
            { key: 'name', header: 'Session', accessor: (r: Row) => r.name, sortable: true },
            { key: 'status', header: 'Status', accessor: (r: Row) => r.status, sortable: true },
            { key: 'updated', header: 'Updated', accessor: (r: Row) => r.updated },
          ]}
          data={ROWS}
          getRowId={(r) => r.id}
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Timeline</span>
        <Timeline>
          <TimelineItem time="9:00 AM" title="Session started" description="Recording began automatically" />
          <TimelineItem time="9:12 AM" title="Decision logged" description="Ship the v2 onboarding flow" />
          <TimelineItem time="9:40 AM" title="Session ended" icon={<CheckCircle2 />} isLast />
        </Timeline>
      </div>

      <PlaygroundRow label="Quote">
        <Quote attribution="Sarah Chen" role="Head of Product" className="max-w-md">
          We should ship the onboarding redesign before touching pricing — sequencing matters more than speed here.
        </Quote>
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">CodeBlock (plain monospace, no syntax highlighting yet)</span>
        <CodeBlock
          filename="session.status.ts"
          code={`export const status: SessionStatusValue = 'ready'\n\nif (status === 'needs-review') {\n  notifyReviewer(session)\n}`}
          className="max-w-lg"
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">TruncatedContent</span>
        <TruncatedContent lines={2} className="max-w-md">
          Executive summary: the team reviewed Q3 roadmap priorities, discussed the onboarding redesign timeline, agreed to
          delay the pricing model change, and assigned Marcus to draft the updated architecture proposal ahead of next
          Friday&apos;s review.
        </TruncatedContent>
      </div>

      <PlaygroundRow label="Interactive: CopyButton">
        <CopyButton value="https://recall.app/sessions/apollo-launch-kickoff" label="Copy link" />
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
