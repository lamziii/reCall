import { Wordmark } from '@/components/branding/logo'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

const SURFACE_COLORS = [
  { label: 'bg', className: 'bg-bg' },
  { label: 'surface', className: 'bg-surface' },
  { label: 'surface-raised', className: 'bg-surface-raised' },
  { label: 'surface-overlay', className: 'bg-surface-overlay' },
  { label: 'surface-hover', className: 'bg-surface-hover' },
  { label: 'surface-active', className: 'bg-surface-active' },
]

const TEXT_COLORS = [
  { label: 'foreground', className: 'bg-foreground' },
  { label: 'muted-foreground', className: 'bg-muted-foreground' },
  { label: 'subtle-foreground', className: 'bg-subtle-foreground' },
  { label: 'disabled-foreground', className: 'bg-disabled-foreground' },
]

const INTERACTIVE_COLORS = [
  { label: 'accent', className: 'bg-accent' },
  { label: 'accent-hover', className: 'bg-accent-hover' },
  { label: 'danger', className: 'bg-danger' },
  { label: 'success', className: 'bg-success' },
  { label: 'warning', className: 'bg-warning' },
  { label: 'border', className: 'bg-border' },
]

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`size-16 rounded-lg border border-border-subtle ${className}`} />
      <span className="font-mono text-caption text-muted-foreground">{label}</span>
    </div>
  )
}

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64, 96]
const RADIUS = [
  { label: 'sm', value: 4 },
  { label: 'md', value: 8 },
  { label: 'lg', value: 12 },
  { label: 'xl', value: 16 },
  { label: '2xl', value: 24 },
]
const SHADOWS = [
  { label: 'xs', className: 'shadow-xs' },
  { label: 'sm', className: 'shadow-sm' },
  { label: 'md', className: 'shadow-md' },
  { label: 'lg', className: 'shadow-lg' },
  { label: 'xl', className: 'shadow-xl' },
] as const

export function FoundationsSection() {
  return (
    <PlaygroundSection
      id="foundations"
      title="Foundations"
      description="Logo, color system, spacing, radius and shadow — the raw tokens every component below is built from. Type scale is next, in Typography."
    >
      <PlaygroundRow label="Logo">
        <Wordmark />
      </PlaygroundRow>

      <PlaygroundRow label="Surfaces">
        {SURFACE_COLORS.map((s) => (
          <Swatch key={s.label} {...s} />
        ))}
      </PlaygroundRow>

      <PlaygroundRow label="Text">
        {TEXT_COLORS.map((s) => (
          <Swatch key={s.label} {...s} />
        ))}
      </PlaygroundRow>

      <PlaygroundRow label="Accent & status">
        {INTERACTIVE_COLORS.map((s) => (
          <Swatch key={s.label} {...s} />
        ))}
      </PlaygroundRow>

      <PlaygroundRow label="Spacing scale (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96)" className="items-end">
        {SPACING.map((px) => (
          <div key={px} className="flex flex-col items-center gap-2">
            <div className="h-3 rounded-sm bg-accent" style={{ width: px }} />
            <span className="font-mono text-caption text-muted-foreground">{px}</span>
          </div>
        ))}
      </PlaygroundRow>

      <PlaygroundRow label="Radius scale">
        {RADIUS.map((r) => (
          <div key={r.label} className="flex flex-col items-center gap-2">
            <div className="size-14 border-2 border-accent" style={{ borderRadius: r.value }} />
            <span className="font-mono text-caption text-muted-foreground">{r.label} · {r.value}px</span>
          </div>
        ))}
      </PlaygroundRow>

      <PlaygroundRow label="Shadow scale">
        {SHADOWS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <div className={`size-16 rounded-lg bg-surface-raised ${s.className}`} />
            <span className="font-mono text-caption text-muted-foreground">{s.className}</span>
          </div>
        ))}
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
