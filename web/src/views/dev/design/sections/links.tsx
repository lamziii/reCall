import { ArrowRight, FileText } from 'lucide-react'
import { Link, ExternalLink, InlineLink, NavLink } from '@/components/links'
import { Body } from '@/components/typography'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function LinksSection() {
  return (
    <PlaygroundSection id="links" title="Links" description="Internal navigation, external destinations, route-aware nav links, and inline prose links.">
      <PlaygroundRow label="Variant">
        <Link to="/dev/design">Default</Link>
        <Link to="/dev/design" variant="subtle">Subtle</Link>
        <Link to="/dev/design" variant="standalone">Standalone</Link>
        <Link to="/dev/design" variant="muted">Muted</Link>
        <Link to="/dev/design" variant="danger">Danger</Link>
      </PlaygroundRow>

      <PlaygroundRow label="With icons, disabled, external">
        <Link to="/dev/design" leadingIcon={<FileText />}>Session transcript</Link>
        <Link to="/dev/design" trailingIcon={<ArrowRight />}>Continue to review</Link>
        <Link to="/dev/design" disabled>Disabled link</Link>
        <ExternalLink href="https://example.com">Recall on the web</ExternalLink>
      </PlaygroundRow>

      <PlaygroundRow label="NavLink (active route)">
        <nav className="flex gap-4 rounded-lg border border-border bg-surface px-4 py-2.5">
          <NavLink to="/dev/design">Design system</NavLink>
          <NavLink to="/dev/design/nonexistent">Sessions</NavLink>
        </nav>
      </PlaygroundRow>

      <PlaygroundRow label="InlineLink (in prose)">
        <Body className="max-w-md">
          This decision supersedes the one made in <InlineLink to="/dev/design">Q2 Roadmap Review</InlineLink>, per Sarah Chen&apos;s
          note on Friday.
        </Body>
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
