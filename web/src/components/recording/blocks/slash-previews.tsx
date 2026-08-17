'use client'

/**
 * Static, lightweight previews for the `/` menu — NOT live editors, just small styled mockups that
 * show what a block looks like before inserting it (Notion-style hover preview). Keyed by slash item
 * title; a title with no entry simply shows no preview panel.
 */
import { CalendarDays } from 'lucide-react'

const Line = ({ w = '100%' }: { w?: string }) => <div className="h-1.5 rounded-full bg-border-strong/70" style={{ width: w }} />

function TodoPreview() {
  return (
    <div className="flex flex-col gap-1.5">
      {[true, false].map((done, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`flex size-3.5 items-center justify-center rounded-[0.25rem] border ${done ? 'border-accent bg-accent text-accent-foreground' : 'border-border-strong'}`}>{done && <span className="text-[8px] leading-none">✓</span>}</span>
          <Line w={done ? '70%' : '85%'} />
        </div>
      ))}
    </div>
  )
}

function TablePreview() {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded border border-border">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className={`h-4 border-b border-r border-border ${i % 3 === 2 ? 'border-r-0' : ''} ${i > 5 ? 'border-b-0' : ''} ${i < 3 ? 'bg-surface' : ''}`} />
      ))}
    </div>
  )
}

function TabsPreview() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 border-b border-border-subtle pb-1 text-[10px]">
        <span className="border-b-2 border-accent pb-0.5 font-medium text-foreground">Tab 1</span>
        <span className="text-subtle-foreground">Tab 2</span>
      </div>
      <Line w="80%" />
    </div>
  )
}

function ChartPreview() {
  const bars = [40, 70, 55, 90]
  return (
    <div className="flex h-12 items-end gap-1.5">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm bg-accent/70" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

function CalloutPreview() {
  return (
    <div className="flex gap-2 rounded-md border border-border-subtle bg-surface p-2">
      <span className="text-sm leading-none">💡</span>
      <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
        <Line w="90%" />
        <Line w="60%" />
      </div>
    </div>
  )
}

function QuotePreview() {
  return (
    <div className="border-l-2 border-border-strong pl-2">
      <div className="flex flex-col gap-1.5"><Line w="85%" /><Line w="65%" /></div>
    </div>
  )
}

function CodePreview() {
  return (
    <div className="rounded-md border border-border-subtle bg-surface p-2 font-mono text-[10px] leading-relaxed">
      <div className="text-hl-keyword" style={{ color: 'var(--hl-keyword)' }}>const <span style={{ color: 'var(--hl-func)' }}>x</span> = <span style={{ color: 'var(--hl-number)' }}>42</span></div>
    </div>
  )
}

function HeadingPreview({ size }: { size: number }) {
  return <div className="font-semibold text-foreground" style={{ fontSize: `${size}rem` }}>Heading</div>
}

function ListPreview({ ordered }: { ordered?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-subtle-foreground">{ordered ? `${i + 1}.` : '•'}</span>
          <Line w={['80%', '65%', '72%'][i]} />
        </div>
      ))}
    </div>
  )
}

function DividerPreview() {
  return <div className="py-2"><div className="h-px w-full bg-border" /></div>
}

function DatePreview() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-accent-muted px-1.5 py-0.5 text-[11px] text-foreground">
      <CalendarDays className="size-3" /> Feb 23, 2027
    </span>
  )
}

function TextPreview() {
  return <div className="flex flex-col gap-1.5"><Line w="90%" /><Line w="75%" /></div>
}

/** title → compact preview thumbnail + one-line caption. Titles absent here show no preview card. */
export const SLASH_PREVIEWS: Record<string, { node: React.ReactNode; caption: string }> = {
  Text: { node: <TextPreview />, caption: 'Plain paragraph' },
  'Heading 1': { node: <HeadingPreview size={1.3} />, caption: 'Big section heading' },
  'Heading 2': { node: <HeadingPreview size={1.1} />, caption: 'Medium heading' },
  'Heading 3': { node: <HeadingPreview size={0.95} />, caption: 'Small heading' },
  'Bullet list': { node: <ListPreview />, caption: 'Simple bullet list' },
  'Numbered list': { node: <ListPreview ordered />, caption: 'Ordered list' },
  'To-do list': { node: <TodoPreview />, caption: 'Checkbox to-dos' },
  Table: { node: <TablePreview />, caption: 'Rows and columns' },
  Tabs: { node: <TabsPreview />, caption: 'Tabbed sections' },
  Divider: { node: <DividerPreview />, caption: 'Visual divider' },
  Quote: { node: <QuotePreview />, caption: 'Capture a quote' },
  Callout: { node: <CalloutPreview />, caption: 'Highlighted note' },
  Chart: { node: <ChartPreview />, caption: 'Simple chart' },
  Code: { node: <CodePreview />, caption: 'Code snippet' },
  Date: { node: <DatePreview />, caption: 'Inline date chip' },
}
