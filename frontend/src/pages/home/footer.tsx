import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/branding/logo'
import { Container } from '@/components/layout/container'
import { Small, Caption } from '@/components/typography'

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '/#how' },
      { label: 'Search', href: '/#search' },
      { label: 'Security', href: '/#security' },
      { label: 'Pricing', href: '/plans' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: 'mailto:hello@recall.app' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Data processing', href: '#' },
    ],
  },
]

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const className = 'focus-ring rounded-sm text-small text-muted-foreground transition-fast hover:text-foreground'
  return href.startsWith('/') ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container width="page" className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Link to="/" className="focus-ring w-fit rounded-md" aria-label="Recall home">
              <Wordmark size="md" />
            </Link>
            <Small className="max-w-[30ch] text-muted-foreground">
              The AI memory system for your organization. Every conversation, remembered.
            </Small>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="flex flex-col gap-3">
              <Caption className="font-medium uppercase tracking-widest text-subtle-foreground">{col.heading}</Caption>
              {col.links.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <Caption className="text-subtle-foreground">© {new Date().getFullYear()} Recall. All rights reserved.</Caption>
          <Caption className="text-subtle-foreground">Made for teams who never want to lose a decision again.</Caption>
        </div>
      </Container>
    </footer>
  )
}
