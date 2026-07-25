import { useState } from 'react'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { PersonChip } from '@/components/data-display/person-chip'
import { UserMenuTrigger } from '@/components/data-display/user-menu-trigger'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function AvatarsPeopleSection() {
  const [selected, setSelected] = useState(false)

  return (
    <PlaygroundSection id="avatars-people" title="Avatars and people" description="Identity — from a single avatar to a removable person chip in a participant list.">
      <PlaygroundRow label="Avatar sizes">
        <Avatar name="Uvejs Mikullovci" size="xs" />
        <Avatar name="Uvejs Mikullovci" size="sm" />
        <Avatar name="Ada Lovelace" size="md" />
        <Avatar name="Grace Hopper" size="lg" />
        <Avatar name="Alan Turing" size="xl" />
      </PlaygroundRow>

      <PlaygroundRow label="Avatar with status, fallback">
        <Avatar name="Ada Lovelace" size="md" status="online" />
        <Avatar name="Grace Hopper" size="md" status="away" />
        <Avatar name="Alan Turing" size="md" status="offline" />
        <Avatar name="Sarah Chen" size="md" src="/does-not-exist.png" />
      </PlaygroundRow>

      <PlaygroundRow label="AvatarGroup">
        <AvatarGroup max={3}>
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="Grace Hopper" size="md" />
          <Avatar name="Alan Turing" size="md" />
          <Avatar name="Sarah Chen" size="md" />
          <Avatar name="Linus Torvalds" size="md" />
        </AvatarGroup>
      </PlaygroundRow>

      <PlaygroundRow label="PersonChip">
        <PersonChip name="Sarah Chen" role="Product" />
        <PersonChip name="Marcus Webb" role="Engineering" onClick={() => setSelected((s) => !s)} selected={selected} />
        <PersonChip name="Priya Patel" role="Design" removable onRemove={() => {}} />
        <PersonChip name="Jordan Lee" role="Sales" disabled />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">UserMenuTrigger</span>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <UserMenuTrigger name="Uvejs Mikullovci" subtitle="uvejs@recall.dev" className="w-56 border border-border bg-surface" />
          </DropdownMenuTrigger>
          <DropdownMenuContent width={224}>
            <DropdownMenuItem>Profile settings</DropdownMenuItem>
            <DropdownMenuItem>Workspace settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </PlaygroundSection>
  )
}
