import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, CircleCheck, ListChecks, HelpCircle, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type ResultIcon = ComponentType<{ className?: string; strokeWidth?: number }>

interface Result {
  icon: ResultIcon
  kind: string
  tone: string
  title: string
  meta: string
}

interface Query {
  text: string
  results: Result[]
}

const QUERIES: Query[] = [
  {
    text: 'What did Sarah decide about pricing?',
    results: [
      {
        icon: CircleCheck,
        kind: 'Decision',
        tone: 'text-success',
        title: 'Ship Pro at $20 — annual billing only at launch',
        meta: 'Pricing review · Aug 12 · Sarah',
      },
      {
        icon: ListChecks,
        kind: 'Task',
        tone: 'text-accent',
        title: 'Write pricing page copy',
        meta: 'Owner Marcus · due Friday',
      },
      {
        icon: CalendarDays,
        kind: 'Meeting',
        tone: 'text-muted-foreground',
        title: 'Pricing review',
        meta: '42 min · 4 participants',
      },
    ],
  },
  {
    text: 'Open questions blocking launch',
    results: [
      {
        icon: HelpCircle,
        kind: 'Open question',
        tone: 'text-warning',
        title: 'Legal sign-off on the new terms?',
        meta: 'Raised by Priya · unresolved',
      },
      {
        icon: HelpCircle,
        kind: 'Open question',
        tone: 'text-warning',
        title: 'Do we support SSO on day one?',
        meta: 'Raised by Marcus · Product sync',
      },
      {
        icon: CircleCheck,
        kind: 'Decision',
        tone: 'text-success',
        title: 'Launch date locked for the 14th',
        meta: 'Product sync · Sarah',
      },
    ],
  },
  {
    text: 'Everything Priya owns this quarter',
    results: [
      {
        icon: User,
        kind: 'Person',
        tone: 'text-accent',
        title: 'Priya Nair · Legal',
        meta: '6 meetings · 3 open items',
      },
      {
        icon: ListChecks,
        kind: 'Task',
        tone: 'text-accent',
        title: 'Finalize updated terms of service',
        meta: 'Owner Priya · in progress',
      },
      {
        icon: HelpCircle,
        kind: 'Open question',
        tone: 'text-warning',
        title: 'Legal sign-off on the new terms?',
        meta: 'Pricing review · unresolved',
      },
    ],
  },
]

export function SearchDemo() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setActive((a) => (a + 1) % QUERIES.length), 4200)
    return () => clearInterval(id)
  }, [reduce])

  const query = QUERIES[active]

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Search className="size-4.5 shrink-0 text-subtle-foreground" strokeWidth={1.5} aria-hidden />
        <div className="relative min-h-5 flex-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={active}
              initial={reduce ? undefined : { opacity: 0, y: 4 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center text-body text-foreground"
            >
              {query.text}
            </motion.span>
          </AnimatePresence>
        </div>
        <span aria-hidden className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-caption text-subtle-foreground sm:inline">
          ⌘K
        </span>
      </div>

      {/* Results */}
      <div className="p-2">
        <AnimatePresence mode="wait">
          <motion.ul
            key={active}
            initial={reduce ? undefined : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            {query.results.map((r, i) => (
              <motion.li
                key={r.title}
                initial={reduce ? undefined : { opacity: 0, y: 6 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3 rounded-xl px-3 py-3 transition-fast hover:bg-surface-hover"
              >
                <r.icon className={cn('mt-0.5 size-4.5 shrink-0', r.tone)} strokeWidth={1.5} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium text-foreground">{r.title}</p>
                  <p className="mt-0.5 truncate text-caption text-subtle-foreground">{r.meta}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-caption text-subtle-foreground">
                  {r.kind}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* Query pager dots */}
      <div className="flex items-center justify-center gap-1.5 border-t border-border py-3">
        {QUERIES.map((q, i) => (
          <button
            key={q.text}
            type="button"
            aria-label={`Show results for: ${q.text}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={cn(
              'focus-ring h-1.5 rounded-full transition-fast',
              i === active ? 'w-6 bg-accent' : 'w-1.5 bg-border-strong hover:bg-subtle-foreground',
            )}
          />
        ))}
      </div>
    </div>
  )
}
