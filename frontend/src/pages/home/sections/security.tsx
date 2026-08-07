import { Lock, ShieldCheck, KeyRound, Database, EyeOff, Globe } from 'lucide-react'
import { Body, Title } from '@/components/typography'
import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'

const POINTS = [
  {
    icon: Lock,
    title: 'Encrypted end to end',
    body: 'Recordings and transcripts are encrypted in transit and at rest with AES-256. Keys are managed, rotated, and never shared.',
  },
  {
    icon: EyeOff,
    title: 'Never trained on your data',
    body: 'Your conversations are yours. We never use customer content to train models — full stop.',
  },
  {
    icon: KeyRound,
    title: 'Granular access control',
    body: 'Roles, workspaces, and per-meeting permissions decide exactly who can see what. SSO and SCIM on business plans.',
  },
  {
    icon: Database,
    title: 'You own your data',
    body: 'Export or delete everything at any time. Set retention windows and Recall enforces them automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance built in',
    body: 'SOC 2 Type II and GDPR compliant, with a DPA available and regular third-party penetration testing.',
  },
  {
    icon: Globe,
    title: 'Choose your region',
    body: 'Keep data resident in the US or EU. Your workspace stays where your policies require it.',
  },
]

export function SecuritySection() {
  return (
    <SectionShell
      id="security"
      align="center"
      eyebrow="Trust"
      title="Your memory, kept private."
      description="Recall holds your most sensitive conversations. We treat them accordingly — with security you can hand to your CISO."
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 3) * 0.06}>
            <div className="flex h-full flex-col gap-3 bg-bg p-7 text-left">
              <p.icon className="size-5 text-accent" strokeWidth={1.5} aria-hidden />
              <Title as="h3" className="text-title">
                {p.title}
              </Title>
              <Body className="text-muted-foreground">{p.body}</Body>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
