'use client'

/**
 * Page-style picker rendered inside a note's ••• actions menu — a small labeled group of the four
 * paper backgrounds, each with a compact preview swatch and a check on the current one. Selecting a
 * style calls onChange immediately (the pane persists it). Shared by personal + meeting note panes.
 */
import { Check } from 'lucide-react'
import { DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { PAPER_STYLES, type PaperStyle } from '@/data/notes/note-model'

const LABELS: Record<PaperStyle, string> = { blank: 'Blank', lined: 'Lined', dotted: 'Dotted', grid: 'Grid' }

/** Tiny inline preview of a paper style (stronger marks than the real canvas so it reads at 18px). */
function PaperSwatch({ style }: { style: PaperStyle }) {
  const mark = 'color-mix(in oklch, var(--color-foreground) 32%, transparent)'
  const bg: Record<PaperStyle, React.CSSProperties> = {
    blank: {},
    lined: { backgroundImage: `linear-gradient(to bottom, ${mark} 1px, transparent 1px)`, backgroundSize: '100% 5px' },
    dotted: { backgroundImage: `radial-gradient(${mark} 1px, transparent 1.2px)`, backgroundSize: '5px 5px' },
    grid: { backgroundImage: `linear-gradient(to bottom, ${mark} 1px, transparent 1px), linear-gradient(to right, ${mark} 1px, transparent 1px)`, backgroundSize: '5px 5px' },
  }
  return <span className="size-4 shrink-0 rounded-sm border border-border bg-surface" style={bg[style]} />
}

export function PageStyleItems({ value, onChange }: { value: PaperStyle; onChange: (style: PaperStyle) => void }) {
  return (
    <>
      <DropdownMenuLabel>Page style</DropdownMenuLabel>
      {PAPER_STYLES.map((style) => (
        <DropdownMenuItem key={style} icon={<PaperSwatch style={style} />} onSelect={() => onChange(style)}>
          <span className="flex w-full items-center justify-between">
            {LABELS[style]}
            {value === style && <Check className="size-3.5 text-foreground" />}
          </span>
        </DropdownMenuItem>
      ))}
    </>
  )
}
