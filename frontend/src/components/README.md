# Component library

Every reusable piece of Recall's UI lives here, organized by responsibility. Nothing in this
directory is a page or knows about routes, API calls, or business logic — that's what
`src/pages/` is for. If a component needs a fetch, a route param, or a redirect, it doesn't
belong in `components/`.

Live, interactive documentation for all of this is at `/dev/design` (`npm run dev`, then visit
that route). This file is the reference for how the pieces fit together; `/dev/design` is where
you look at them.

## Categories

| Folder | What lives here |
|---|---|
| `primitives/` | The smallest structural atoms: `Box`, `Inline`, `Spacer`, `AspectRatio`, `VisuallyHidden`. Also re-exports `Stack`/`Grid`/`Container`/`Surface`/`Divider`, which live in `layout/`/`data-display/` for historical reasons — see the note in `primitives/index.ts`. |
| `typography/` | `Text` and its named variants (`H1`, `Body`, `Caption`, `Heading`, `CodeText`, ...). |
| `buttons/` | `ButtonGroup`, `SplitButton`. `Button`/`IconButton` themselves live in `ui/` alongside the other core interaction primitives — re-exported here for a complete category entry point. |
| `links/` | `Link`, `ExternalLink`, `NavLink`, `InlineLink`. |
| `forms/` | Every input, `FormField`, and the selection controls (`Select`, `Combobox`, `Checkbox`, `Radio`, `Switch`, `SegmentedControl`, ...). |
| `feedback/` | Loading and status feedback: `Spinner`, `LoadingDots`, `Progress`, `Skeleton`, `Alert`, `EmptyState`, `ErrorState`, `InlineError`, `Toast`/`useToast`. |
| `navigation/` | `Tabs`, `Breadcrumb`, `Pagination`, `NavigationItem`, `Stepper`, `BackButton`, `Accordion`, `DetailsList`, `CommandMenu`, `SearchOverlay`. |
| `data-display/` | Everything that presents structured data: `Badge`/`StatusBadge`/`StatusDot`, `Avatar`, `Card`, `Table`/`DataTable`, `Calendar` and the date/time pickers built on it, `Timeline`, `Quote`, `CodeBlock`, `CopyButton`, `TruncatedContent`. |
| `overlays` (in `ui/`) | `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `Dialog`/`ConfirmDialog`, `Drawer`/`Sheet`, built on one shared Portal + positioning engine (`ui/popover.tsx`, `ui/search-shell.tsx`). Kept in `ui/` rather than split into a separate `overlays/` folder, since they're built directly on the same engine as `Collapsible`/`ScrollArea`/`Resizable` that already live there. |
| `layout/` | The assembled shell: `AppShell`, `Sidebar`, `Header`, `Panel`, `Page`, `Section`, `SplitView`/`ResizablePanels`, `Workspace`. |
| `branding/` | `Logo`, `Wordmark`. |
| `recall/` | Domain components — `SessionStatus`, `TaskStatus`, `DecisionStatus`, `RecordingIndicator`, `ConfidenceIndicator`, `TranscriptSpeaker`, `Mention`, `EntityLink`, `ProjectChip`, `SessionMetadata`, `TimestampLink`, `DueDate`, `Assignee`, `InsightLabel`. These are the only components allowed to know Recall's vocabulary (session/decision/task/insight); everything else in this directory is product-agnostic. |
| `ui/` | Headless/low-level engines other categories build on: `Button`/`IconButton`, `Popover`, `Portal`, `Collapsible`, `ScrollArea`, `Resizable`, `KeyboardShortcut`, the overlay set above. |

Each category has a barrel `index.ts` — `import { Button } from '@/components/ui'` works, but
prefer importing from the specific file (`@/components/ui/button`) in application code so
bundlers can tree-shake and so you're not pulling in unrelated exports.

## Import examples

```tsx
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/form-field'
import { Input } from '@/components/forms/input'

function ExampleField() {
  return (
    <FormField label="Session title" required>
      {(field) => <Input {...field} placeholder="Q3 Product Strategy Sync" />}
    </FormField>
  )
}
```

```tsx
import { Select } from '@/components/forms/select'

<Select
  placeholder="Choose a project"
  options={[{ value: 'apollo', label: 'Apollo Launch' }]}
/>
```

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

<Dialog>
  <DialogTrigger><Button>Rename</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Rename session</DialogTitle></DialogHeader>
  </DialogContent>
</Dialog>
```

```tsx
import { Tabs, TabList, Tab, TabPanel } from '@/components/navigation/tabs'

<Tabs defaultValue="summary">
  <TabList>
    <Tab value="summary">Executive Summary</Tab>
    <Tab value="decisions">Decisions</Tab>
  </TabList>
  <TabPanel value="summary">...</TabPanel>
  <TabPanel value="decisions">...</TabPanel>
</Tabs>
```

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/data-display/table'

<Table>
  <TableHeader><TableRow><TableHead>Session</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>Q3 Product Strategy Sync</TableCell></TableRow></TableBody>
</Table>
```

```tsx
import { EmptyState } from '@/components/feedback/empty-state'
import { Inbox } from 'lucide-react'

<EmptyState icon={<Inbox />} title="No sessions yet" action={<Button size="sm">Start a session</Button>} />
```

```tsx
import { SessionStatus } from '@/components/recall/session-status'

<SessionStatus status="needs-review" />
```

```tsx
import { TranscriptSpeaker } from '@/components/recall/transcript-speaker'
import { Mention } from '@/components/recall/mention'

<TranscriptSpeaker name="Sarah Chen" timestamp="00:12" confidence={96} onTimestampClick={jumpTo}>
  Let's revisit the <Mention type="project">Apollo Launch</Mention> timeline.
</TranscriptSpeaker>
```

## Composition rules

- **Compose, don't configure.** `SessionStatus`/`TaskStatus`/`DecisionStatus` are thin maps from
  a status value to `<StatusBadge tone label>` — they don't invent new visuals. If you need a new
  status vocabulary, add another one of these small mapping components; don't add a `type` prop
  to `StatusBadge` itself.
- **One overlay engine.** `Popover` (`ui/popover.tsx`) owns positioning, portal rendering, and
  the click-outside/escape/focus-trap wiring. `DropdownMenu`, `ContextMenu`, `Combobox`, and
  `DatePicker` are all built on it — don't hand-roll another positioned overlay.
- **`cn()` everywhere.** Every component that accepts `className` merges it last, via
  `cn(...)` (`@/lib/utils`), so a consumer's override always wins over the component's defaults.
- **Controlled or uncontrolled, never forced.** Interactive components take `value`/`defaultValue`
  + `onChange` pairs via `useControllableState` (`@/hooks`) so callers can go either way.
- **Refs forward** on every component that renders a single focusable/measurable DOM node
  (inputs, buttons, `Avatar`), so `Tooltip`/`Popover`/form libraries can attach to them.

## Accessibility rules

- Every focus state uses the single shared `.focus-ring` utility (`styles/tokens/index.css`) —
  never a one-off `outline`/`ring` class.
- Icon-only controls (`IconButton`, `CopyButton`, `PriorityIndicator`) require an accessible
  name (`label`/`aria-label`) as a required prop, not an afterthought.
- Status is never color-only — pair a color with a visible word or number (see
  `ConfidenceIndicator`, `DueDate`).
- Overlays trap focus and return it to the trigger on close; this is handled once, in the shared
  engine, not per-component.
- This targets **WCAG 2.2 AA** as a design goal. It has not been through a formal accessibility
  audit or assistive-technology testing pass — see the Accessibility section on `/dev/design`.

## Token usage

Never hardcode a color, spacing, radius, shadow, or duration value in a component. Use the
Tailwind utilities the token system generates (`bg-surface`, `text-muted-foreground`,
`rounded-lg`, `shadow-md`, `duration-fast` via `.transition-fast`) — see
`../styles/tokens/*.css`. If a value you need doesn't exist as a token, add it to the token
layer first; don't reach for an arbitrary Tailwind value (`bg-[#1a1a1a]`) in a component.

## When to use each component (quick reference)

- Need a label + control + error message wired together? `FormField`, not a hand-built
  `<label>`/`<input>`/`<p>` stack.
- Need a status pill for a Recall object? Check `recall/` first for an existing mapping
  (`SessionStatus`, `TaskStatus`, ...) before reaching for raw `StatusBadge`.
- Need a positioned popup? `Popover`/`DropdownMenu`/`Tooltip` — never a manually `position:
  absolute`-ed div.
- Need a two-pane layout with a draggable divider? `SplitView` (a `ResizablePanelGroup` preset),
  not a hand-rolled flex layout with pointer listeners.
- Need vertical rhythm between blocks on a page? `Stack`/`Section`'s built-in gap, not manual
  `mt-*`/`mb-*` on siblings.

## When *not* to create a new component

- If it's a one-off arrangement of existing components for a single page, it's page code, not a
  new reusable component — build it in `src/pages/`.
- If it duplicates 90% of an existing component's markup with one different class, add a variant
  to the existing component instead (see how `Button`'s `variant`/`size` cva handles six looks in
  one file).
- If it needs to know about a specific Recall entity's shape (a `Session` object, a `Task` id),
  it's domain logic for a page or a `recall/` component to consume — not a new generic primitive.

## How to add a component

1. Pick the right category folder from the table above (or `recall/` if it's domain-specific).
2. Build it from existing primitives/tokens — don't hardcode values, don't add a new dependency
   without checking it's not already solved by something in `ui/`, `primitives/`, or a hook in
   `src/hooks/`.
3. Type every prop; export the prop interface alongside the component.
4. Forward refs if the component renders a single DOM node that a parent might need to measure,
   focus, or position against.
5. Add it to the category's `index.ts` barrel.
6. Add a section (or extend an existing one) in `src/pages/dev/design/sections/`, following the
   pattern below, and register it in `src/pages/dev/design/index.tsx`'s `NAV` array + JSX list.
7. If the component has real interactive behavior (keyboard nav, open/close, validation), add a
   `*.test.tsx` next to it — see `../test/setup.ts` and any existing `*.test.tsx` for the pattern.

## How to update `/dev/design`

Each section is one file in `src/pages/dev/design/sections/`, wrapped in the shared
`<PlaygroundSection id title description>` (and `<PlaygroundRow label>` for a row of variants):

```tsx
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function MySection() {
  return (
    <PlaygroundSection id="my-section" title="My section" description="...">
      <PlaygroundRow label="Variant">
        <MyComponent variant="a" />
        <MyComponent variant="b" />
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
```

Use realistic Recall content (session/project/task names like "Q3 Product Strategy Sync",
"Apollo Launch") — never lorem ipsum. Show every variant, size, and state (disabled/loading/
error/selected) that the component supports. If the component has non-trivial interaction, wire
up real `useState` so the section is a working playground, not a static screenshot.
