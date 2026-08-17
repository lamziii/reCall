'use client'

/**
 * Chart block — a native Tiptap node that persists DATA (never a rendered image) in its `data` attr and
 * renders a clean, theme-aware SVG chart. Editing the data updates the chart live. The model is
 * multi-series-shaped (series[]) so extra series drop in later; V1's inline editor edits one series.
 *
 * Colors come from CSS variables (--recall-chart-N, defined in tiptap.css for light + dark) so charts
 * follow Recall's theme automatically — no gradients, no 3D, restrained palette.
 */
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps, type Editor } from '@tiptap/react'
import { useRef, useState } from 'react'
import { BarChart3, Pencil, Plus, Trash2, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useEditorSurface } from './editor-surface'
import { cn } from '@/lib/utils'

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut'
export interface ChartSeries {
  name: string
  values: number[]
}
export interface ChartData {
  title: string
  type: ChartType
  legend: boolean
  categories: string[]
  series: ChartSeries[]
}

export const DEFAULT_CHART: ChartData = {
  title: 'Untitled chart',
  type: 'bar',
  legend: false,
  categories: ['Jan', 'Feb', 'Mar'],
  series: [{ name: 'Series 1', values: [20, 35, 28] }],
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'donut', label: 'Donut' },
]
// Recall-branded ramp: blue → softer blue → blue-gray → neutral grays (semantic tokens, theme-aware).
const PALETTE = ['var(--chart-primary)', 'var(--chart-secondary)', 'var(--chart-tertiary)', 'var(--chart-neutral-1)', 'var(--chart-neutral-2)', 'var(--chart-neutral-3)']

function coerce(data: unknown): ChartData {
  const d = (data && typeof data === 'object' ? data : {}) as Partial<ChartData>
  const categories = Array.isArray(d.categories) ? d.categories.map(String) : DEFAULT_CHART.categories
  const series = Array.isArray(d.series) && d.series.length
    ? d.series.map((s, i) => ({ name: String(s?.name ?? `Series ${i + 1}`), values: (Array.isArray(s?.values) ? s.values : []).map((v) => Number(v) || 0) }))
    : DEFAULT_CHART.series
  return {
    title: typeof d.title === 'string' ? d.title : DEFAULT_CHART.title,
    type: (CHART_TYPES.some((t) => t.value === d.type) ? d.type : 'bar') as ChartType,
    legend: Boolean(d.legend),
    categories,
    series,
  }
}

export const ChartBlock = Node.create({
  name: 'chart',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      data: {
        default: DEFAULT_CHART,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute('data-chart') || '')
          } catch {
            return DEFAULT_CHART
          }
        },
        renderHTML: (attrs) => ({ 'data-chart': JSON.stringify(attrs.data ?? DEFAULT_CHART) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-chart]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, class: 'recall-chart' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartView)
  },
})

/** Inserts a chart with starter data. */
export function insertChart(editor: Editor, range: { from: number; to: number }) {
  editor.chain().focus().deleteRange(range).insertContent({ type: 'chart', attrs: { data: DEFAULT_CHART } }).run()
}

function ChartView({ node, updateAttributes, editor, deleteNode }: NodeViewProps) {
  const data = coerce(node.attrs.data)
  const surface = useEditorSurface()
  const [editing, setEditing] = useState(false)
  const editable = editor.isEditable && !surface.compact

  function patch(next: Partial<ChartData>) {
    updateAttributes({ data: { ...data, ...next } })
  }

  return (
    <NodeViewWrapper className="recall-chart-block">
      <div className="recall-chart-card group relative" contentEditable={false}>
        <div className="mb-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{data.title || 'Untitled chart'}</span>
          {editable && (
            <div className="flex items-center gap-0.5 opacity-0 transition-fast group-hover:opacity-100">
              <button type="button" onClick={() => setEditing((v) => !v)} className="focus-ring inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-caption text-muted-foreground transition-fast hover:bg-surface-hover hover:text-foreground">
                <Pencil className="size-3.5" /> Edit data
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button type="button" aria-label="Chart options" className="focus-ring flex size-6 items-center justify-center rounded-md text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground [&>svg]:size-3.5"><BarChart3 /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent width={170} placement="bottom-end">
                  {CHART_TYPES.map((t) => (
                    <DropdownMenuItem key={t.value} onSelect={() => patch({ type: t.value })}>
                      {data.type === t.value ? '● ' : '○ '}{t.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => patch({ legend: !data.legend })}>{data.legend ? 'Hide legend' : 'Show legend'}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem icon={<Trash2 />} danger onSelect={() => deleteNode()}>Delete chart</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <ChartRenderer data={data} />

        {data.legend && <ChartLegend data={data} />}

        {editing && editable && <ChartDataEditor data={data} onChange={patch} onClose={() => setEditing(false)} />}
      </div>
    </NodeViewWrapper>
  )
}

// ---- SVG renderer -------------------------------------------------------------------------------

const W = 640
const H = 240
const PAD = { top: 12, right: 12, bottom: 26, left: 30 }

type TipFn = (e: React.MouseEvent, label: string, value: number) => void

function ChartRenderer({ data }: { data: ChartData }) {
  const isPie = data.type === 'pie' || data.type === 'donut'
  const ref = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ x: number; y: number; label: string; value: number } | null>(null)
  const show: TipFn = (e, label, value) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, label, value })
  }
  const hide = () => setTip(null)
  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${data.type} chart: ${data.title}`} className="recall-chart-svg block">
        {isPie ? <PieChart data={data} onHover={show} onLeave={hide} /> : <CartesianChart data={data} onHover={show} onLeave={hide} />}
      </svg>
      {tip && (
        <div className="recall-chart-tooltip" style={{ left: tip.x, top: tip.y }}>
          <div className="text-caption text-subtle-foreground">{tip.label}</div>
          <div className="text-small font-medium tabular-nums text-foreground">{tip.value}</div>
        </div>
      )}
    </div>
  )
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

function CartesianChart({ data, onHover, onLeave }: { data: ChartData; onHover: TipFn; onLeave: () => void }) {
  const cats = data.categories
  const n = cats.length || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const max = niceMax(Math.max(1, ...data.series.flatMap((s) => s.values.map((v) => (Number.isFinite(v) ? v : 0)))))
  const x = (i: number) => PAD.left + (innerW * (i + 0.5)) / n
  const y = (v: number) => PAD.top + innerH * (1 - Math.max(0, v) / max)
  const baseline = PAD.top + innerH

  return (
    <g>
      {/* subtle gridlines: 0, mid, max */}
      {[0, 0.5, 1].map((t) => {
        const gy = PAD.top + innerH * (1 - t)
        return (
          <g key={t}>
            <line x1={PAD.left} y1={gy} x2={W - PAD.right} y2={gy} className="recall-chart-grid" />
            <text x={PAD.left - 6} y={gy + 3} textAnchor="end" className="recall-chart-axis">{Math.round(max * t)}</text>
          </g>
        )
      })}
      {data.type === 'bar' &&
        data.series.map((s, si) => {
          const groupW = (innerW / n) * 0.62
          const barW = groupW / data.series.length
          return s.values.map((v, i) => {
            const gx = x(i) - groupW / 2 + si * barW
            const vy = y(v)
            return <rect key={`${si}-${i}`} x={gx} y={vy} width={Math.max(1, barW - 2)} height={Math.max(0, baseline - vy)} rx={2} style={{ fill: PALETTE[si % PALETTE.length] }} className="recall-chart-bar recall-chart-interactive" onMouseMove={(e) => onHover(e, cats[i] ?? '', v)} onMouseLeave={onLeave} />
          })
        })}
      {(data.type === 'line' || data.type === 'area') &&
        data.series.map((s, si) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
          const color = PALETTE[si % PALETTE.length]
          return (
            <g key={si}>
              {data.type === 'area' && s.values.length > 0 && (
                <polygon points={`${x(0)},${baseline} ${pts} ${x(s.values.length - 1)},${baseline}`} style={{ fill: color }} className="recall-chart-area" />
              )}
              <polyline points={pts} fill="none" style={{ stroke: color }} className="recall-chart-line" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3.5} style={{ fill: color }} className="recall-chart-interactive" onMouseMove={(e) => onHover(e, cats[i] ?? '', v)} onMouseLeave={onLeave} />
              ))}
            </g>
          )
        })}
      {cats.map((c, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="recall-chart-axis">{c}</text>
      ))}
    </g>
  )
}

function PieChart({ data, onHover, onLeave }: { data: ChartData; onHover: TipFn; onLeave: () => void }) {
  const values = (data.series[0]?.values ?? []).map((v) => Math.max(0, Number(v) || 0))
  const total = values.reduce((a, b) => a + b, 0) || 1
  const cx = W / 2
  const cy = H / 2
  const r = Math.min(W, H) / 2 - 16
  const inner = data.type === 'donut' ? r * 0.62 : 0
  let angle = -Math.PI / 2
  return (
    <g>
      {values.map((v, i) => {
        const slice = (v / total) * Math.PI * 2
        const a0 = angle
        const a1 = angle + slice
        angle = a1
        const large = slice > Math.PI ? 1 : 0
        const p = (rad: number, ang: number) => `${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`
        const d = inner > 0
          ? `M ${p(inner, a0)} L ${p(r, a0)} A ${r} ${r} 0 ${large} 1 ${p(r, a1)} L ${p(inner, a1)} A ${inner} ${inner} 0 ${large} 0 ${p(inner, a0)} Z`
          : `M ${cx} ${cy} L ${p(r, a0)} A ${r} ${r} 0 ${large} 1 ${p(r, a1)} Z`
        return <path key={i} d={d} style={{ fill: PALETTE[i % PALETTE.length] }} className="recall-chart-slice recall-chart-interactive" onMouseMove={(e) => onHover(e, data.categories[i] ?? '', v)} onMouseLeave={onLeave} />
      })}
    </g>
  )
}

function ChartLegend({ data }: { data: ChartData }) {
  const isPie = data.type === 'pie' || data.type === 'donut'
  const items = isPie ? data.categories.map((c, i) => ({ label: c, color: PALETTE[i % PALETTE.length] })) : data.series.map((s, i) => ({ label: s.name, color: PALETTE[i % PALETTE.length] }))
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {items.map((it, i) => (
        <li key={i} className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <span className="size-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

// ---- inline data editor -------------------------------------------------------------------------

function ChartDataEditor({ data, onChange, onClose }: { data: ChartData; onChange: (next: Partial<ChartData>) => void; onClose: () => void }) {
  const values = data.series[0]?.values ?? []
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  function setRow(i: number, label: string, value: number) {
    const categories = [...data.categories]
    categories[i] = label
    const nextValues = [...values]
    nextValues[i] = value
    onChange({ categories, series: [{ name: data.series[0]?.name ?? 'Series 1', values: nextValues }, ...data.series.slice(1)] })
  }
  function addRow() {
    onChange({ categories: [...data.categories, `Item ${data.categories.length + 1}`], series: [{ name: data.series[0]?.name ?? 'Series 1', values: [...values, 0] }, ...data.series.slice(1)] })
  }
  function removeRow(i: number) {
    onChange({ categories: data.categories.filter((_, j) => j !== i), series: [{ name: data.series[0]?.name ?? 'Series 1', values: values.filter((_, j) => j !== i) }, ...data.series.slice(1)] })
  }

  // Quiet, integrated cells — borderless inputs that highlight only on hover/focus, hair-line row
  // separators. Reads as editing structured data in Recall, not filling an Excel form.
  const cell = 'w-full rounded-md bg-transparent px-2 py-1 text-small text-foreground outline-none transition-fast hover:bg-surface-hover focus:bg-surface-hover'
  return (
    <div className="mt-3 rounded-xl bg-surface-raised/60 p-2.5" onMouseDown={stop} onKeyDown={stop}>
      <div className="mb-1.5 flex items-center gap-2">
        <input
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Chart title"
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-small font-medium text-foreground outline-none transition-fast hover:bg-surface-hover focus:bg-surface-hover"
        />
        <select value={data.type} onChange={(e) => onChange({ type: e.target.value as ChartType })} className="rounded-md bg-transparent px-1.5 py-1 text-caption text-muted-foreground outline-none transition-fast hover:bg-surface-hover">
          {CHART_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button type="button" onClick={onClose} aria-label="Close editor" className="focus-ring flex size-7 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-hover hover:text-foreground [&>svg]:size-4"><X /></button>
      </div>
      <div className="grid grid-cols-[1fr_6rem_1.5rem] gap-2 px-2 pb-1 text-caption text-subtle-foreground">
        <span>Label</span><span className="text-right">Value</span><span />
      </div>
      <div className="flex flex-col divide-y divide-border-subtle/60">
        {data.categories.map((label, i) => (
          <div key={i} className="group/row grid grid-cols-[1fr_6rem_1.5rem] items-center gap-2 py-0.5">
            <input value={label} onChange={(e) => setRow(i, e.target.value, values[i] ?? 0)} className={cell} />
            <input type="number" value={Number.isFinite(values[i]) ? values[i] : 0} onChange={(e) => setRow(i, label, Number(e.target.value) || 0)} className={cn(cell, 'text-right tabular-nums')} />
            <button type="button" onClick={() => removeRow(i)} aria-label="Remove row" className={cn('flex size-6 items-center justify-center rounded-md text-subtle-foreground opacity-0 transition-fast hover:text-danger group-hover/row:opacity-100 [&>svg]:size-3.5', data.categories.length <= 1 && 'pointer-events-none !opacity-0')}><Trash2 /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="focus-ring mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-caption text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground">
        <Plus className="size-3.5" /> Add row
      </button>
    </div>
  )
}
