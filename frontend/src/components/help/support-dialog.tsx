import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormField, Input, Select, Textarea } from '@/components/forms'
import { useToast } from '@/components/feedback/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { isLiveMode } from '@/data/live/data-mode'
import { createSupportRequest, type SupportCategory } from '@/data/live/support'

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: 'question', label: 'General question' },
  { value: 'bug', label: 'Something\'s broken' },
  { value: 'billing', label: 'Billing' },
  { value: 'feature_request', label: 'Feature request' },
  { value: 'other', label: 'Other' },
]

export interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Contact support" — persists to `support_requests`; see data/live/support.ts for the (not yet
 *  configured) email-delivery boundary. Never claim a human has been notified, only that the
 *  message was received. */
export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [category, setCategory] = useState<SupportCategory>('question')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setCategory('question')
    setSubject('')
    setMessage('')
    setError(null)
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError('Add a subject and a short description.')
      return
    }
    if (!isLiveMode || !user) {
      toast({ title: 'Sign in to contact support', description: 'Reaching support needs your account.', variant: 'warning' })
      return
    }
    setSending(true)
    setError(null)
    try {
      await createSupportRequest({
        workspaceId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        category,
        subject,
        message,
      })
      toast({
        title: 'Message sent',
        description: `We've got it — we'll follow up at ${user.email}.`,
        variant: 'success',
      })
      reset()
      onOpenChange(false)
    } catch {
      setError("Couldn't send your message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact support</DialogTitle>
          <DialogDescription>Tell us what's going on — we'll get back to you by email.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          {error && <p className="text-small text-danger">{error}</p>}
          <FormField label="What's this about?">
            {(f) => <Select {...f} value={category} onChange={(e) => setCategory(e.target.value as SupportCategory)} options={CATEGORY_OPTIONS} />}
          </FormField>
          <FormField label="Subject" required>
            {(f) => <Input {...f} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Recording stalls after 30 minutes" autoFocus />}
          </FormField>
          <FormField label="Details" required>
            {(f) => (
              <Textarea
                {...f}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened, and what did you expect instead?"
                rows={5}
              />
            )}
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} loading={sending}>
            Send message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
