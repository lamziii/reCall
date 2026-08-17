'use client'

/**
 * Date block — an inline atomic node that renders as a polished `@February 23, 2027` chip and stores a
 * REAL canonical value (not just formatted text): `{ value: 'YYYY-MM-DD', includeTime: boolean }`
 * (value becomes 'YYYY-MM-DDTHH:mm' when includeTime). Clicking the chip reopens a minimal picker built
 * on the native <input type="date"> (Today / Tomorrow / optional time / clear) — no calendar library.
 *
 * Quick entry: `/date` (slash) and the `@today` / `@tomorrow` input rules (gated by the same Markdown-
 * shortcuts setting as the other input rules).
 */
import { Node, InputRule } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps, type Editor } from '@tiptap/react'
import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// ---- canonical value helpers (tz-safe: date-only values never drift across timezones) -------------

/** Local YYYY-MM-DD for `date` (defaults to today). */
function isoDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function todayISO(): string {
  return isoDate()
}
export function offsetISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

/** Parse a stored value into a local Date without UTC drift (splits date-only vs datetime). */
function parseValue(value: string): { date: Date; time: string | null } {
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  if (timePart) {
    const [hh, mm] = timePart.split(':').map(Number)
    return { date: new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0), time: timePart }
  }
  return { date: new Date(y, (m || 1) - 1, d || 1), time: null }
}

/** "February 23, 2027" (+ " · 3:45 PM" when the value carries a time). */
export function formatDate(value: string): string {
  if (!value) return 'Pick a date'
  const { date, time } = parseValue(value)
  const day = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  if (!time) return day
  return `${day} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export const DateBlock = Node.create({
  name: 'date',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      value: { default: todayISO() },
      includeTime: { default: false },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-date]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-date': '' }]
  },
  addNodeView() {
    return ReactNodeViewRenderer(DateView)
  },
  addInputRules() {
    const rule = (find: RegExp, days: number) =>
      new InputRule({
        find,
        handler: ({ range, chain }) => {
          chain().deleteRange(range).insertContent([{ type: 'date', attrs: { value: offsetISO(days) } }, { type: 'text', text: ' ' }]).run()
        },
      })
    return [rule(/@today\s$/, 0), rule(/@tomorrow\s$/, 1)]
  },
})

/** Inserts a date chip (defaulting to today) at the slash range. */
export function insertDate(editor: Editor, range: { from: number; to: number }) {
  editor.chain().focus().deleteRange(range).insertContent([{ type: 'date', attrs: { value: todayISO() } }, { type: 'text', text: ' ' }]).run()
}

function DateView({ node, updateAttributes, editor }: NodeViewProps) {
  const [open, setOpen] = useState(false)
  const value = String(node.attrs.value || todayISO())
  const includeTime = Boolean(node.attrs.includeTime)
  const { date: current } = parseValue(value)
  const datePart = value.split('T')[0]
  const timePart = value.split('T')[1] ?? current.toTimeString().slice(0, 5)
  const editable = editor.isEditable

  function setDate(nextDate: string) {
    updateAttributes({ value: includeTime ? `${nextDate}T${timePart}` : nextDate })
  }
  function toggleTime(on: boolean) {
    updateAttributes({ includeTime: on, value: on ? `${datePart}T${timePart}` : datePart })
  }

  const chip = (
    <button
      type="button"
      contentEditable={false}
      onClick={() => editable && setOpen((o) => !o)}
      className="recall-date-chip inline-flex items-center gap-1 rounded px-1 align-baseline text-inherit [&>svg]:size-3.5"
    >
      <CalendarDays />
      <span>{formatDate(value)}</span>
    </button>
  )

  return (
    <NodeViewWrapper as="span" className="inline">
      {editable ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>{chip}</PopoverTrigger>
          <PopoverContent width={232} placement="bottom-start" className="p-3">
            <div className="flex flex-col gap-2.5">
              <input
                type="date"
                value={datePart}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-small text-foreground outline-none focus-visible:border-border-accent"
              />
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setDate(todayISO())} className={cn('flex-1 rounded-md border border-border px-2 py-1 text-caption transition-fast hover:bg-surface-hover', datePart === todayISO() && 'border-border-accent text-foreground')}>Today</button>
                <button type="button" onClick={() => setDate(offsetISO(1))} className={cn('flex-1 rounded-md border border-border px-2 py-1 text-caption transition-fast hover:bg-surface-hover', datePart === offsetISO(1) && 'border-border-accent text-foreground')}>Tomorrow</button>
              </div>
              <label className="flex items-center justify-between text-caption text-muted-foreground">
                <span>Include time</span>
                <input type="checkbox" checked={includeTime} onChange={(e) => toggleTime(e.target.checked)} />
              </label>
              {includeTime && (
                <input
                  type="time"
                  value={timePart}
                  onChange={(e) => e.target.value && updateAttributes({ value: `${datePart}T${e.target.value}` })}
                  className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-small text-foreground outline-none focus-visible:border-border-accent"
                />
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        chip
      )}
    </NodeViewWrapper>
  )
}
