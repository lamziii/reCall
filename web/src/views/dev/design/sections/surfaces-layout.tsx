import { Calendar, FolderKanban, LayoutGrid, Search as SearchIcon, Settings } from 'lucide-react'
import { Sidebar, SidebarHeader, SidebarSection, SidebarItem, SidebarFooter } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Panel } from '@/components/layout/panel'
import { SplitView } from '@/components/layout/split-view'
import { Section } from '@/components/layout/section'
import { Wordmark } from '@/components/branding/logo'
import { Avatar } from '@/components/data-display/avatar'
import { Divider } from '@/components/data-display/divider'
import { IconButton, Button } from '@/components/ui/button'
import { SearchInput } from '@/components/forms/search-input'
import { Box, Inline, Spacer, AspectRatio, VisuallyHidden, Stack, Grid, Surface, Container } from '@/components/primitives'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function SurfacesLayoutSection() {
  return (
    <PlaygroundSection
      id="surfaces-layout"
      title="Surfaces and layout"
      description="The structural primitives — Box, Stack, Grid, Surface, Section — plus the assembled shell (Sidebar, Header, Panel, SplitView) they compose into."
    >
      <PlaygroundRow label="Box (styleless escape hatch)">
        <Box className="rounded-md border border-dashed border-border p-3 text-small text-muted-foreground">Box</Box>
      </PlaygroundRow>

      <PlaygroundRow label="Stack (vertical, default) / Inline (horizontal, wraps)">
        <Stack gap={2} className="rounded-md border border-border p-3">
          <span className="rounded bg-surface-active px-2 py-1 text-caption">Row one</span>
          <span className="rounded bg-surface-active px-2 py-1 text-caption">Row two</span>
        </Stack>
        <Inline gap={2} className="w-40 rounded-md border border-border p-3">
          <span className="rounded bg-surface-active px-2 py-1 text-caption">A</span>
          <span className="rounded bg-surface-active px-2 py-1 text-caption">B</span>
          <span className="rounded bg-surface-active px-2 py-1 text-caption">C</span>
        </Inline>
      </PlaygroundRow>

      <PlaygroundRow label="Grid">
        <Grid cols={3} gap={2} className="w-64">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <span key={n} className="flex h-10 items-center justify-center rounded bg-surface-active text-caption text-muted-foreground">
              {n}
            </span>
          ))}
        </Grid>
      </PlaygroundRow>

      <PlaygroundRow label="Surface (elevation levels)">
        <Surface level="surface" padding="sm" className="text-caption text-muted-foreground">surface</Surface>
        <Surface level="raised" padding="sm" className="text-caption text-muted-foreground">raised</Surface>
        <Surface level="overlay" padding="sm" className="text-caption text-muted-foreground">overlay</Surface>
      </PlaygroundRow>

      <PlaygroundRow label="Container widths">
        <div className="w-full rounded border border-dashed border-border p-3">
          <Container width="content" className="rounded bg-surface-active px-0 py-1.5 text-center text-caption text-muted-foreground">
            content (42rem max)
          </Container>
        </div>
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Section</span>
        <div className="rounded-xl border border-border px-4">
          <Section title="Discussion Topics" description="Everything the group covered, grouped by theme." actions={<Button size="sm" variant="secondary">Export</Button>}>
            <p className="text-small text-muted-foreground">Section content goes here.</p>
          </Section>
        </div>
      </div>

      <PlaygroundRow label="Divider">
        <div className="flex w-full flex-col gap-4">
          <Divider />
          <Divider label="or" />
        </div>
      </PlaygroundRow>

      <PlaygroundRow label="AspectRatio">
        <AspectRatio ratio={16 / 9} className="w-48 rounded-md bg-surface-active" />
        <AspectRatio ratio={1} className="w-20 rounded-md bg-surface-active" />
      </PlaygroundRow>

      <PlaygroundRow label="Spacer, VisuallyHidden">
        <span className="text-caption text-muted-foreground">Left</span>
        <Spacer axis="horizontal" size={24} className="rounded border border-dashed border-border-strong" />
        <span className="text-caption text-muted-foreground">Right</span>
        <button className="focus-ring rounded-md border border-border px-2 py-1 text-caption text-muted-foreground">
          <VisuallyHidden>Screen-reader-only label</VisuallyHidden>
          Visible label
        </button>
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Sidebar + Header preview</span>
        <div className="flex h-96 w-full overflow-hidden rounded-xl border border-border">
          <Sidebar>
            <SidebarHeader>
              <Wordmark />
            </SidebarHeader>
            <SidebarSection label="Workspace">
              <SidebarItem icon={<LayoutGrid />} active>
                Home
              </SidebarItem>
              <SidebarItem icon={<FolderKanban />}>Projects</SidebarItem>
              <SidebarItem icon={<Calendar />}>Calendar</SidebarItem>
            </SidebarSection>
            <SidebarFooter>
              <div className="flex items-center gap-2">
                <Avatar name="Uvejs Mikullovci" size="sm" />
                <span className="text-small text-foreground">Uvejs</span>
              </div>
            </SidebarFooter>
          </Sidebar>
          <div className="flex min-w-0 flex-1 flex-col">
            <Header
              left={<span className="text-small font-medium text-foreground">Home</span>}
              right={
                <>
                  <SearchInput className="w-48" />
                  <IconButton icon={<Settings />} label="Settings" />
                </>
              }
            />
            <div className="flex flex-1 items-center justify-center text-small text-subtle-foreground">Content area</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Panel</span>
        <div className="h-48 w-full max-w-sm overflow-hidden rounded-xl border border-border">
          <Panel title="Filters" actions={<IconButton icon={<SearchIcon />} label="Search" size="sm" className="size-7" />}>
            <div className="p-4 text-small text-muted-foreground">Panel content goes here.</div>
          </Panel>
        </div>
      </div>

      <PlaygroundRow label="Interactive: resizable SplitView (drag the divider)">
        <div className="h-56 w-full overflow-hidden rounded-xl border border-border">
          <SplitView>
            <div className="flex h-full items-center justify-center bg-surface text-small text-muted-foreground">Sidebar pane</div>
            <div className="flex h-full items-center justify-center bg-surface-raised text-small text-muted-foreground">Detail pane</div>
          </SplitView>
        </div>
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
