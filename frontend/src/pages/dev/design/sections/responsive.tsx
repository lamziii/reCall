import type { ReactNode } from 'react'
import { Copy, Archive, Trash2 } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/button'
import { ButtonGroup } from '@/components/buttons'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/data-display/table'
import { PlaygroundSection } from '../playground-section'

const FRAMES = [
  { label: '320px · mobile', width: 320 },
  { label: '768px · tablet', width: 768 },
  { label: '1280px · desktop', width: 1280 },
]

function FrameRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {FRAMES.map((frame) => (
        <div key={frame.label} className="flex flex-col gap-2">
          <span className="font-mono text-caption text-subtle-foreground">{frame.label}</span>
          <div
            className="overflow-x-auto rounded-lg border border-border bg-surface p-3"
            style={{ width: Math.min(frame.width, 340) }}
          >
            {children}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ResponsiveSection() {
  return (
    <PlaygroundSection
      id="responsive"
      title="Responsive behavior"
      description="Every component is checked at 320 / 768 / 1280 / 1440px. The frames below are scaled down to fit this page, but the reflow behavior — wrapping, scrolling, truncating — is the real thing, not a simulation."
    >
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">ButtonGroup wraps instead of overflowing</span>
        <FrameRow>
          <ButtonGroup wrap>
            <Button size="sm" variant="secondary">
              Day
            </Button>
            <Button size="sm" variant="secondary">
              Week
            </Button>
            <Button size="sm" variant="secondary">
              Month
            </Button>
            <Button size="sm" variant="secondary">
              Quarter
            </Button>
          </ButtonGroup>
        </FrameRow>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Table scrolls horizontally instead of breaking layout</span>
        <FrameRow>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Q3 Product Strategy Sync</TableCell>
                <TableCell>Ready</TableCell>
                <TableCell>42 min</TableCell>
                <TableCell>6</TableCell>
                <TableCell>2h ago</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </FrameRow>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Long labels truncate intentionally, not mid-layout</span>
        <FrameRow>
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-raised p-2">
            <span className="min-w-0 flex-1 truncate text-small text-foreground">
              Q3 Product Strategy Sync — full planning review with design, engineering, and go-to-market
            </span>
            <IconButton icon={<Copy />} label="Copy link" size="sm" variant="ghost" />
            <IconButton icon={<Archive />} label="Archive" size="sm" variant="ghost" />
            <IconButton icon={<Trash2 />} label="Delete" size="sm" variant="ghost" />
          </div>
        </FrameRow>
      </div>

      <ul className="flex max-w-2xl flex-col gap-2 text-small text-muted-foreground">
        <li>— Dialog and ConfirmDialog cap at max-w-md and never exceed the viewport (m-auto + built-in scroll on the &lt;dialog&gt;).</li>
        <li>— Drawer/Sheet use max-w-sm and h-dvh, so on a 320px viewport they still leave a visible backdrop margin.</li>
        <li>— CommandMenu and SearchOverlay clamp to max-w-lg and sit at 15vh from the top, staying inside the viewport at every size tested.</li>
        <li>— Form controls (Input, Select, Combobox) default to w-full in a form layout; fixed widths in this playground are for side-by-side comparison only.</li>
      </ul>
    </PlaygroundSection>
  )
}
