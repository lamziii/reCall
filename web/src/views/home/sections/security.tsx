import { Lock, EyeOff, KeyRound, Globe, ShieldCheck, Database } from 'lucide-react'
import { SectionShell } from '../section-shell'
import { Stagger, RevealItem } from '../reveal'

const POINTS = [
  { icon: Lock, title: 'Encrypted end to end', body: 'AES-256 in transit and at rest.' },
  { icon: EyeOff, title: 'Never trained on', body: 'Your conversations train no model.' },
  { icon: KeyRound, title: 'Workspace isolation', body: 'Per-meeting roles. SSO & SCIM.' },
  { icon: Globe, title: 'Regional storage', body: 'Keep data resident in the US or EU.' },
  { icon: ShieldCheck, title: 'SOC 2 & GDPR', body: 'DPA and pen tests on request.' },
  { icon: Database, title: 'You own it', body: 'Export or delete everything, anytime.' },
]

export function SecuritySection() {
  return (
    <SectionShell
      id="security"
      align="center"
      eyebrow="Trust"
      title="Your memory, kept private."
      description="Security you can hand to your CISO."
    >
      <Stagger className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3" amount={0.2}>
        {POINTS.map((p) => (
          <RevealItem key={p.title}>
            <div className="flex h-full flex-col gap-3 bg-bg p-7 text-left">
              <p.icon className="size-5 text-accent" strokeWidth={1.5} aria-hidden />
              <h3 className="text-title font-semibold text-foreground">{p.title}</h3>
              <p className="text-small text-muted-foreground">{p.body}</p>
            </div>
          </RevealItem>
        ))}
      </Stagger>
    </SectionShell>
  )
}
