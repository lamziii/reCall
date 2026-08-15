import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Input, Select } from '@/components/forms'
import { Button, IconButton } from '@/components/ui/button'
import { Badge } from '@/components/data-display/badge'
import { Caption, Small } from '@/components/typography'
import { INVITE_ROLE_OPTIONS, type InviteRole } from '../options'
import { INVITE_ERROR_MESSAGE, validateInviteEmail } from '../validation'
import type { OnboardingForm } from '../types'

const FIELD_SIZE = 'h-12 rounded-xl border-border-subtle bg-surface-raised text-body'

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
  currentUserEmail: string
}

/** Step 6 — invite teammates. Emails are validated (format, self, duplicate) and held in the form;
 *  they're written to `workspace_invites` when onboarding finishes. Fully skippable. */
export function InviteStep({ form, update, currentUserEmail }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('member')
  const [error, setError] = useState<string | null>(null)

  function addInvite(event: FormEvent) {
    event.preventDefault()
    const code = validateInviteEmail(email, {
      currentUserEmail,
      pendingEmails: form.invites.map((i) => i.email),
    })
    if (code !== 'ok') {
      setError(INVITE_ERROR_MESSAGE[code])
      return
    }
    update({ invites: [...form.invites, { email: email.trim(), role }] })
    setEmail('')
    setError(null)
  }

  function removeInvite(target: string) {
    update({ invites: form.invites.filter((i) => i.email !== target) })
  }

  return (
    <div className="flex flex-col gap-5">
      <form className="flex flex-col gap-2" onSubmit={addInvite} noValidate>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              type="email"
              className={FIELD_SIZE}
              placeholder="teammate@company.com"
              value={email}
              error={Boolean(error)}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              aria-label="Teammate email"
            />
          </div>
          <Select
            className={`${FIELD_SIZE} w-32`}
            options={INVITE_ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            aria-label="Role"
          />
          <Button type="submit" variant="secondary" leftIcon={<Plus />} className="h-12">
            Add
          </Button>
        </div>
        {error && <Caption className="text-danger">{error}</Caption>}
      </form>

      {form.invites.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {form.invites.map((invite) => (
            <li key={invite.email} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-small text-foreground">{invite.email}</span>
              <Badge variant="default">{invite.role === 'admin' ? 'Admin' : 'Member'}</Badge>
              <IconButton icon={<X />} label={`Remove ${invite.email}`} variant="ghost" size="sm" onClick={() => removeInvite(invite.email)} />
            </li>
          ))}
        </ul>
      ) : (
        <Small className="text-subtle-foreground">No invitations yet. You're the workspace owner — add teammates now, or skip and invite them later.</Small>
      )}
    </div>
  )
}
