import { useEffect, useState } from 'react'
import { Avatar } from '@/components/data-display/avatar'
import { FormField } from '@/components/forms/form-field'
import { Input } from '@/components/forms/input'
import { Button } from '@/components/ui/button'
import { Label, Small, Caption } from '@/components/typography'
import { useToast } from '@/components/feedback'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserProfile } from '@/data/live/use-user-profile'
import { isLiveMode } from '@/data/live/data-mode'
import { updatePersonalInfo } from '@/data/live/user-settings'

function splitName(name: string): { first: string; last: string } {
  const [first = '', ...rest] = name.trim().split(/\s+/)
  return { first, last: rest.join(' ') }
}

export function PersonalInfoSection() {
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const { profile } = useUserProfile()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)

  // Prefer the Firestore profile's split name once it resolves; fall back to the auth display name.
  useEffect(() => {
    if (profile?.first_name || profile?.last_name) {
      setFirstName(profile.first_name ?? '')
      setLastName(profile.last_name ?? '')
    } else {
      const { first, last } = splitName(user?.name ?? '')
      setFirstName(first)
      setLastName(last)
    }
  }, [profile, user])

  const currentName = `${firstName} ${lastName}`.trim()
  const dirty = currentName !== (user?.name ?? '').trim() && currentName.length > 0

  async function handleSave() {
    setSaving(true)
    try {
      if (isLiveMode && user) {
        await updatePersonalInfo({ uid: user.id, firstName, lastName })
        await refreshUser()
      } else {
        await refreshUser({ name: currentName })
      }
      toast({ title: 'Personal info updated', variant: 'success' })
    } catch {
      toast({ title: "Couldn't save changes", description: 'Check your connection and try again.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar name={user?.name ?? 'Recall User'} src={user?.photoURL} size="lg" />
        <div className="flex min-w-0 flex-col">
          <Small className="font-medium text-foreground">{user?.name ?? 'Recall User'}</Small>
          <Caption className="text-subtle-foreground">{user?.email ?? '—'}</Caption>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name">
          {(f) => <Input {...f} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />}
        </FormField>
        <FormField label="Last name">
          {(f) => <Input {...f} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />}
        </FormField>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label as="span">Email</Label>
        <Input value={user?.email ?? ''} disabled />
        <Caption className="text-subtle-foreground">Your email is tied to your sign-in method and can't be changed here.</Caption>
      </div>

      <Button className="w-fit" onClick={() => void handleSave()} loading={saving} disabled={!dirty}>
        Save changes
      </Button>
    </div>
  )
}
