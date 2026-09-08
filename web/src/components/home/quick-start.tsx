import { useNavigate } from '@/lib/router-compat'
import { Mic, PenLine, type IconComponent } from '@/components/icons'
import { Surface } from '@/components/layout/surface'
import { Body, Title } from '@/components/typography'

type Tile = { icon: IconComponent; title: string; description: string; href: string }

const tiles: Tile[] = [
  { icon: Mic, title: 'New session', description: 'Record or import a conversation', href: '/app/record' },
  { icon: PenLine, title: 'New note', description: 'Start a blank page', href: '/app/notes/new' },
]

export function QuickStart() {
  const navigate = useNavigate()

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      {tiles.map(({ icon: Icon, title, description, href }) => (
        <Surface
          key={href}
          level="raised"
          border
          padding="lg"
          role="button"
          tabIndex={0}
          onClick={() => navigate(href)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate(href)
            }
          }}
          className="flex min-w-0 cursor-pointer flex-col gap-3 transition-colors hover:border-border-strong hover:bg-surface-overlay focus-visible:border-accent focus-visible:outline-none"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-surface text-muted-foreground">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <Title>{title}</Title>
            <Body className="text-muted-foreground">{description}</Body>
          </div>
        </Surface>
      ))}
    </div>
  )
}
