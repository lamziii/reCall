import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Search, HelpCircle } from 'lucide-react'
import { MENTION_ICONS } from '@/components/recall/mention'
import { DecisionStatus, type DecisionStatusValue } from '@/components/recall/decision-status'
import { TaskStatus, type TaskStatusValue } from '@/components/recall/task-status'
import { SessionStatus, type SessionStatusValue } from '@/components/recall/session-status'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { cn } from '@/lib/utils'

type Row = {
  icon: ReactNode
  title: string
  meta: string
  trailing?: ReactNode
}

const icon = (type: keyof typeof MENTION_ICONS) => {
  const I = MENTION_ICONS[type]
  return <I className="size-4" />
}

const QUERIES: { text: string; results: Row[] }[] = [
  {
    text: 'When did we decide to redesign pricing?',
    results: [
      {
        icon: icon('decision'),
        title: 'Redesign the pricing page — ship at $20, annual',
        meta: 'Pricing review · Aug 12',
        trailing: <DecisionStatus status={'approved' as DecisionStatusValue} />,
      },
      { icon: icon('session'), title: 'Pricing review', meta: '42 min · 4 people', trailing: <SessionStatus status={'ready' as SessionStatusValue} /> },
      { icon: icon('task'), title: 'Write pricing page copy', meta: 'Marcus · due Friday', trailing: <TaskStatus status={'todo' as TaskStatusValue} /> },
    ],
  },
  {
    text: "What's blocking launch?",
    results: [
      { icon: <HelpCircle className="size-4" />, title: 'Legal sign-off on the new terms?', meta: 'Raised by Priya · unresolved' },
      { icon: icon('task'), title: 'SSO for enterprise sign-in', meta: 'Marcus · launch blocker', trailing: <TaskStatus status={'blocked' as TaskStatusValue} /> },
      {
        icon: icon('decision'),
        title: 'Launch locked for the 14th',
        meta: 'Product sync · Sarah',
        trailing: <DecisionStatus status={'approved' as DecisionStatusValue} />,
      },
    ],
  },
  {
    text: 'Everything Priya owns',
    results: [
      { icon: icon('person'), title: 'Priya Nair · Legal', meta: '6 meetings · 3 open items' },
      { icon: icon('task'), title: 'Finalize updated terms of service', meta: 'due next week', trailing: <TaskStatus status={'in-progress' as TaskStatusValue} /> },
      { icon: <HelpCircle className="size-4" />, title: 'Legal sign-off on the new terms?', meta: 'Pricing review · unresolved' },
    ],
  },
]

export function SearchDemo() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setActive((a) => (a + 1) % QUERIES.length), 4600)
    return () => clearInterval(id)
  }, [reduce])

  const query = QUERIES[active]

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-[0_28px_80px_-40px_rgba(0,0,0,0.7)]">
      {/* Command input — query text is keyed on `active` and remounts in lockstep with the results
          below, so the two never fall out of sync (no separate AnimatePresence to drift). */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5">
        <Search className="size-4 shrink-0 text-subtle-foreground" strokeWidth={1.75} aria-hidden />
        <div className="min-h-5 flex-1">
          <motion.span
            key={active}
            initial={reduce ? false : { opacity: 0, y: 3 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center text-body text-foreground"
          >
            {query.text}
            {!reduce && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-accent align-middle" />}
          </motion.span>
        </div>
        <KeyboardShortcut keys={['⌘', 'K']} />
      </div>

      {/* Results — remounts on the same `active` key as the query above. */}
      <ul key={active} className="flex flex-col p-1.5">
        {query.results.map((r, i) => (
          <motion.li
            key={r.title}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: 0.04 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-fast',
              i === 0 ? 'bg-surface-hover' : 'hover:bg-surface-hover',
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground">
              {r.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium text-foreground">{r.title}</p>
              <p className="truncate text-caption text-subtle-foreground">{r.meta}</p>
            </div>
            {r.trailing && <div className="shrink-0">{r.trailing}</div>}
          </motion.li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-1.5 border-t border-border-subtle py-3">
        {QUERIES.map((q, i) => (
          <button
            key={q.text}
            type="button"
            aria-label={`Show: ${q.text}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={cn(
              'focus-ring h-1.5 rounded-full transition-fast',
              i === active ? 'w-5 bg-accent' : 'w-1.5 bg-border-strong hover:bg-subtle-foreground',
            )}
          />
        ))}
      </div>
    </div>
  )
}
