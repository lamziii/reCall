import { Plus, X } from 'lucide-react'
import { Input } from '@/components/forms'
import { IconButton, Button } from '@/components/ui/button'
import type { OnboardingData } from './types'
import { FIELD_SIZE } from './field-style'

export function InviteMembers({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
}) {
  function updateInvite(index: number, value: string) {
    const next = [...data.invites]
    next[index] = value
    onChange({ invites: next })
  }

  function removeInvite(index: number) {
    onChange({ invites: data.invites.filter((_, i) => i !== index) })
  }

  function addInvite() {
    onChange({ invites: [...data.invites, ''] })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {data.invites.map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="email"
              className={FIELD_SIZE}
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => updateInvite(index, e.target.value)}
              aria-label={`Teammate email ${index + 1}`}
            />
            {data.invites.length > 1 && (
              <IconButton icon={<X />} label="Remove email" variant="ghost" onClick={() => removeInvite(index)} />
            )}
          </div>
        ))}
      </div>

      <Button variant="text" size="sm" leftIcon={<Plus />} onClick={addInvite} className="w-fit">
        Add another
      </Button>
    </div>
  )
}
