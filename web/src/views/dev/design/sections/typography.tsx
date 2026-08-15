import { Display, H1, H2, H3, Title, Subtitle, BodyLarge, Body, Small, Caption, Label, Code, Text } from '@/components/typography'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function TypographySection() {
  return (
    <PlaygroundSection
      id="typography"
      title="Typography"
      description="One polymorphic Text primitive. Prefer the named exports (H1, Body, Caption, ...) — Text itself is the escape hatch for custom `as` + variant combinations."
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-6">
        <Display>Q3 Product Strategy Sync</Display>
        <H1>Session Review</H1>
        <H2>Discussion Topics</H2>
        <H3>Architecture decision approved</H3>
        <Title>Apollo Launch</Title>
        <Subtitle>42-minute session · 6 participants</Subtitle>
        <BodyLarge>Sarah Chen opened the session by reviewing last week&apos;s onboarding metrics.</BodyLarge>
        <Body>The team agreed to revisit the pricing model before the next planning cycle.</Body>
        <Small>Transcript processing finished 2 minutes ago.</Small>
        <Caption>Recorded Jul 24, 2026 · 10:02 AM</Caption>
        <Label>Session title</Label>
        <Code>session.status === &quot;ready&quot;</Code>
      </div>

      <PlaygroundRow label="Weight">
        <Text variant="body" weight="regular">Regular</Text>
        <Text variant="body" weight="medium">Medium</Text>
        <Text variant="body" weight="semibold">Semibold</Text>
        <Text variant="body" weight="bold">Bold</Text>
      </PlaygroundRow>

      <PlaygroundRow label="Color">
        <Text color="primary">Primary</Text>
        <Text color="secondary">Secondary</Text>
        <Text color="tertiary">Tertiary</Text>
        <Text color="accent">Accent</Text>
        <Text color="danger">Danger</Text>
        <Text color="success">Success</Text>
        <Text color="warning">Warning</Text>
        <Text color="disabled">Disabled</Text>
      </PlaygroundRow>

      <PlaygroundRow label="Alignment, truncate, line-clamp">
        <div className="flex w-64 flex-col gap-3">
          <Text align="right" className="w-full">Right-aligned</Text>
          <Text truncate className="w-full">A very long session title that needs to truncate at the container edge</Text>
          <Text lineClamp={2} className="w-full">
            Executive summary: the team reviewed Q3 roadmap priorities, discussed the onboarding redesign, and agreed on next
            steps for the Apollo Launch project ahead of Friday&apos;s review.
          </Text>
        </div>
      </PlaygroundRow>

      <PlaygroundRow label="Mono, inverse, as override">
        <Code>const decisions = 12</Code>
        <span className="rounded-md bg-foreground px-3 py-1.5">
          <Text as="span" color="inverse">
            Inverse on light chip
          </Text>
        </span>
        <H3 as="span">H3 styling rendered as a span</H3>
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
