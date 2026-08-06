import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar } from '@/components/data-display/avatar'
import { Caption } from '@/components/typography'
import { DEV_USERS, type DevUser } from '@/data/dev-tasks/types'

/**
 * "Who are you?" attribution picker. Two fixed choices (Uvejs / Lorik), no free text. This is
 * device-local attribution, NOT authentication — access is the Firebase session that gates the
 * route. Not dismissable by clicking away: a choice is required to attribute actions.
 */
export function IdentityDialog({ open, onSelect }: { open: boolean; onSelect: (user: DevUser) => void }) {
  return (
    <Dialog open={open}>
      <DialogContent showClose={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Who are you?</DialogTitle>
          <DialogDescription>Pick your name so we can attribute the work. This is just a label for the board — not a login.</DialogDescription>
        </DialogHeader>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {DEV_USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id as DevUser)}
              className="focus-ring flex flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5 transition-base hover:border-foreground/25 hover:bg-surface-hover"
            >
              <Avatar name={user.name} size="xl" />
              <span className="text-body font-medium text-foreground">{user.name}</span>
            </button>
          ))}
        </div>

        <Caption className="mt-4 text-center text-subtle-foreground">You can switch anytime from the menu in the header.</Caption>
      </DialogContent>
    </Dialog>
  )
}
