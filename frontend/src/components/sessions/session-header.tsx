import { useNavigate } from 'react-router-dom'
import { Download, MoreHorizontal, Share2 } from 'lucide-react'
import { BackButton } from '@/components/navigation/back-button'
import { Button, IconButton } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SessionStatus } from '@/components/recall/session-status'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { Body, H2 } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import type { SessionDetailData } from '@/data/sessions/types'

export function SessionHeader({ session }: { session: SessionDetailData }) {
  const navigate = useNavigate()
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-5 pb-6">
      <BackButton label="Sessions" onClick={() => navigate('/app/sessions')} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <H2>{session.title}</H2>
            <SessionStatus status={session.status} />
          </div>
          <Body className="text-muted-foreground">
            {[session.projectName, session.fullDateTimeLabel, session.durationLabel].filter(Boolean).join(' · ')}
          </Body>
          {session.participants.length > 0 && (
            <AvatarGroup max={6}>
              {session.participants.map((p) => (
                <Avatar key={p.name} name={p.name} size="sm" />
              ))}
            </AvatarGroup>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 />}
            onClick={() => toast({ title: 'Share link copied', description: 'Sharing is mocked for this demo.' })}
          >
            Share
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download />}
            onClick={() => toast({ title: 'Export started', description: 'Export is mocked for this demo.' })}
          >
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <IconButton icon={<MoreHorizontal />} label="More actions" variant="secondary" size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => toast({ title: 'Session archived', description: 'This is mocked for the demo.' })}>
                Archive session
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast({ title: 'Link copied' })}>Copy link</DropdownMenuItem>
              <DropdownMenuItem danger onSelect={() => toast({ title: 'Delete is disabled in this demo', variant: 'warning' })}>
                Delete session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
