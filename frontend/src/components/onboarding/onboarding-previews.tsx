import type { ReactElement } from 'react'
import { GitBranch, CheckSquare, HelpCircle, Search, Video, FolderKanban, Square, MousePointer2, ArrowRight } from 'lucide-react'
import { StatusBadge } from '@/components/data-display/status-badge'
import { cn } from '@/lib/utils'
import type { PlaceholderKind } from '@/lib/onboarding/tutorial-config'

/**
 * Themed, believable mini-product previews for the tour's media area — built from real Recall atoms
 * and tokens, not gray boxes. Each fills a 16:9 frame. Purely presentational (aria-hidden; the
 * accessible description comes from the media alt text).
 */

/** A decorative cursor that hints "this is where you interact." No animation by default. */
function Cursor({ className }: { className?: string }) {
  return (
    <MousePointer2
      className={cn('pointer-events-none absolute size-4 fill-foreground text-bg drop-shadow-sm', className)}
      aria-hidden
    />
  )
}

function Chip({ icon: Icon, label, tone }: { icon: typeof GitBranch; label: string; tone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-caption font-medium text-foreground">
      <Icon className={cn('size-3', tone)} />
      {label}
    </span>
  )
}

function WelcomePreview() {
  return (
    <div className="flex h-full items-center justify-center gap-4 px-6">
      <div className="w-40 rounded-lg border border-border bg-surface-raised p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-subtle-foreground">
            <Video className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-caption font-medium text-foreground">Product sync</p>
            <p className="text-[10px] text-subtle-foreground">42 min · 4 people</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1">
          <StatusBadge tone="success" label="Ready" />
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
      <div className="flex flex-col gap-1.5">
        <Chip icon={GitBranch} label="Decision" tone="text-success" />
        <Chip icon={CheckSquare} label="Task" tone="text-accent" />
        <Chip icon={HelpCircle} label="Question" tone="text-warning" />
      </div>
    </div>
  )
}

function RecordPreview() {
  const bars = [5, 9, 6, 12, 8, 14, 7, 11, 6, 13, 9, 5, 10, 7, 12, 6]
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="w-56 rounded-xl border border-border bg-surface-raised p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
            <span className="size-2 rounded-full bg-danger" /> Recording
          </span>
          <span className="font-mono text-caption tabular-nums text-foreground">00:02:14</span>
        </div>
        <div className="my-3.5 flex h-10 items-center justify-center gap-[3px]" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-border-strong" style={{ height: `${h * 2}px` }} />
          ))}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="pointer-events-none flex w-full items-center justify-center gap-2 rounded-md bg-danger px-3 py-2 text-small font-medium text-danger-foreground"
        >
          <Square className="size-3.5 fill-current" />
          Stop recording
        </button>
      </div>
      <Cursor className="bottom-[26%] right-[30%]" />
    </div>
  )
}

function ExtractPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-5 px-6">
      <div className="w-36 rounded-lg border border-border bg-surface-raised p-3 shadow-xs">
        <p className="text-caption font-medium text-foreground">Pricing review</p>
        <div className="mt-2 flex flex-col gap-1">
          {[10, 8, 11].map((w, i) => (
            <span key={i} className="h-1.5 rounded-full bg-surface-active" style={{ width: `${w * 8}px` }} />
          ))}
        </div>
      </div>
      <ArrowRight className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
      <div className="flex w-44 flex-col gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
          <GitBranch className="size-3.5 shrink-0 text-success" />
          <span className="truncate text-caption text-foreground">Ship Pro at $20</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
          <CheckSquare className="size-3.5 shrink-0 text-accent" />
          <span className="truncate text-caption text-foreground">Write pricing copy</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
          <HelpCircle className="size-3.5 shrink-0 text-warning" />
          <span className="truncate text-caption text-foreground">Legal sign-off?</span>
        </div>
      </div>
    </div>
  )
}

function ConnectedPreview() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-64 rounded-xl border border-border bg-surface-raised p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-4 shrink-0 text-accent" />
          <span className="text-small font-medium text-foreground">Write pricing page copy</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-border-subtle pt-3">
          <span className="text-caption text-subtle-foreground">Linked to</span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-caption text-foreground">
            <FolderKanban className="size-3 text-subtle-foreground" />
            Pricing
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-caption text-foreground">
            <Video className="size-3 text-subtle-foreground" />
            Product sync
          </span>
        </div>
      </div>
    </div>
  )
}

function AskPreview() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-72 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-xs">
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
          <Search className="size-3.5 text-subtle-foreground" />
          <span className="text-caption text-foreground">What did we decide about onboarding?</span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <p className="text-caption leading-relaxed text-muted-foreground">
            You agreed to <span className="text-foreground">simplify the first-run experience</span> and add a short product tour.
          </p>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[10px] text-subtle-foreground">
            <Video className="size-3" />
            Product sync · 18:32
          </span>
        </div>
      </div>
    </div>
  )
}

const PREVIEWS: Record<PlaceholderKind, () => ReactElement> = {
  welcome: WelcomePreview,
  record: RecordPreview,
  extract: ExtractPreview,
  connected: ConnectedPreview,
  ask: AskPreview,
}

export function OnboardingPreview({ kind }: { kind: PlaceholderKind }) {
  const Preview = PREVIEWS[kind]
  return (
    <div aria-hidden className="size-full">
      <Preview />
    </div>
  )
}
