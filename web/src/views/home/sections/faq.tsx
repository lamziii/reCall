import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionShell } from '../section-shell'

const FAQS = [
  {
    q: 'How is this different from meeting notes?',
    a: 'Notes tools hand you a summary and stop. Recall turns every meeting into structured, linked knowledge that stays searchable and compounds over time.',
  },
  {
    q: 'Which meetings does it work with?',
    a: 'In person and any video call — Zoom, Google Meet, Microsoft Teams. Recall joins, captures, and processes automatically.',
  },
  {
    q: 'Is my data used to train AI?',
    a: 'Never. Your conversations train no model, are encrypted in transit and at rest, and can be exported or deleted anytime.',
  },
  {
    q: 'Can I control who sees what?',
    a: 'Yes — roles, workspaces, and per-meeting permissions. Business plans add SSO and SCIM.',
  },
  {
    q: 'What does it cost to start?',
    a: 'Free, no card required. Paid plans add team workspaces, longer retention, and admin controls.',
  },
]

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const id = `faq-${index}`
  return (
    <div className="border-b border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center justify-between gap-4 rounded-md py-5 text-left"
      >
        <span className="text-body font-medium text-foreground">{q}</span>
        <Plus
          className={cn('size-4 shrink-0 text-subtle-foreground transition-transform duration-300', open && 'rotate-45')}
          strokeWidth={1.5}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? undefined : { height: 0, opacity: 0 }}
            animate={reduce ? undefined : { height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[60ch] pb-5 pr-8 text-body text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FaqSection() {
  return (
    <SectionShell id="faq" eyebrow="FAQ" title="Questions, answered." width="content" align="center">
      <div className="border-t border-border text-left">
        {FAQS.map((item, i) => (
          <FaqItem key={item.q} q={item.q} a={item.a} index={i} />
        ))}
      </div>
    </SectionShell>
  )
}
