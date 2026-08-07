import { Plus } from 'lucide-react'
import { Body } from '@/components/typography'
import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'

const FAQS = [
  {
    q: 'How is Recall different from a meeting-notes tool?',
    a: 'Notes tools hand you a summary and stop there. Recall turns every meeting into structured, linked knowledge — decisions, tasks, people, and projects — that stays searchable and compounds over time. The value grows with every conversation, not just the last one.',
  },
  {
    q: 'Which meetings and calls does it work with?',
    a: 'In-person conversations and any video call — Zoom, Google Meet, Microsoft Teams, and more. Recall joins, captures clean audio, and processes everything automatically once the meeting ends.',
  },
  {
    q: 'How accurate is the extraction?',
    a: "Recall uses frontier language models to read the full transcript in context, so decisions and action items are captured with their owners and nuance intact. Every extracted item links back to the exact moment it was said, so it's always verifiable.",
  },
  {
    q: 'Is my data used to train AI models?',
    a: 'No. Your conversations are never used to train any model. Data is encrypted in transit and at rest, and you can export or delete it at any time.',
  },
  {
    q: 'Can I control who sees what?',
    a: 'Yes. Roles, workspaces, and per-meeting permissions give you precise control. Business plans add SSO and SCIM for centrally managed access.',
  },
  {
    q: 'What does it cost to start?',
    a: 'You can start free, no credit card required. Paid plans add team workspaces, longer retention, and admin controls — see the pricing page for details.',
  },
]

export function FaqSection() {
  return (
    <SectionShell
      eyebrow="FAQ"
      title="Questions, answered."
      width="content"
      align="center"
    >
      <div className="flex flex-col divide-y divide-border border-y border-border">
        {FAQS.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i, 4) * 0.05}>
            <details className="group py-1">
              <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-left text-body font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  className="size-4.5 shrink-0 text-subtle-foreground transition-transform duration-200 group-open:rotate-45"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </summary>
              <Body className="max-w-[62ch] pb-5 pr-8 text-muted-foreground">{item.a}</Body>
            </details>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
