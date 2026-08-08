import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Wordmark } from '@/components/branding/logo'
import { Button, IconButton } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar } from '@/components/data-display/avatar'
import { APP_BASE } from '@/app/shell/nav-config'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'How it works', href: '/#how' },
  { label: 'Search', href: '/#search' },
  { label: 'Security', href: '/#security' },
  { label: 'Pricing', href: '/plans' },
]

/**
 * Client-side router Link for every destination. Section links are `/#id` (not bare `#id`) so they
 * always resolve to the homepage anchor — clicking "Security" from /plans lands on /#security, not
 * /plans#security. The homepage's scroll-to-hash effect handles the actual scroll.
 */
function NavLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

export function Navigation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-200',
        scrolled ? 'border-b border-border bg-bg/95' : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="focus-ring rounded-md" aria-label="Recall home">
          <Wordmark size="lg" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.label}>
              <NavLink
                href={link.href}
                className="focus-ring block rounded-md px-3 py-1.5 text-small text-muted-foreground transition-fast hover:text-foreground"
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <button
              type="button"
              onClick={() => navigate(APP_BASE)}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-small font-medium text-foreground transition-fast hover:bg-surface-hover"
            >
              <Avatar src={user.photoURL} name={user.name} size="sm" />
              Dashboard
            </button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate('/onboarding')}>
                Start free
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger>
            <IconButton icon={<Menu />} label="Open menu" variant="ghost" className="md:hidden" />
          </SheetTrigger>
          <SheetContent side="right" className="max-w-72" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <NavLink
                    href={link.href}
                    className="focus-ring block rounded-md px-3 py-2.5 text-body text-foreground transition-fast hover:bg-surface-hover"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2">
                    <Avatar src={user.photoURL} name={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-foreground">{user.name}</p>
                      <p className="truncate text-small text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate(APP_BASE)}>Go to dashboard</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                  <Button onClick={() => navigate('/onboarding')}>Start free</Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
