import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Wordmark } from '@/components/branding/logo'
import { Button, IconButton } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const LINKS = [
  { label: 'Product', href: '#capabilities' },
  { label: 'How it works', href: '#workflow' },
  { label: 'Security', href: '#' },
  { label: 'Resources', href: '#' },
]

export function Navigation() {
  const navigate = useNavigate()
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
        <a href="#top" className="focus-ring rounded-md" aria-label="Recall home">
          <Wordmark size="lg" />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="focus-ring block rounded-md px-3 py-1.5 text-small text-muted-foreground transition-fast hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            Start free
          </Button>
        </div>

        <Sheet>
          <SheetTrigger>
            <IconButton icon={<Menu />} label="Open menu" variant="ghost" className="md:hidden" />
          </SheetTrigger>
          <SheetContent side="right" className="max-w-72" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="focus-ring block rounded-md px-3 py-2.5 text-body text-foreground transition-fast hover:bg-surface-hover"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button onClick={() => navigate('/onboarding')}>Start free</Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
