import { useState } from 'react'
import { MailCheck, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/feedback'
import { FormField, Input } from '@/components/forms'
import { Body, Caption, Small } from '@/components/typography'
import { CodeBlock } from '@/components/data-display/code-block'
import {
  isEmailVerified,
  sendVerificationEmail,
  refreshEmailVerified,
  startTotpEnrollment,
  finalizeTotpEnrollment,
  TwoFactorUnavailableError,
  type TotpEnrollmentStart,
} from '@/lib/auth/auth-service'
import type { OnboardingForm } from '../types'
import type { TwoFactorStatus } from '@/data/live/onboarding'

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
}

/**
 * Step 2 — account security. Two real actions:
 *  1. Email verification (fully supported): sends the Firebase verification email.
 *  2. TOTP two-factor: attempts real enrollment. If the project hasn't enabled Identity Platform /
 *     multi-factor (a Console change we can't make from the repo), we mark it "pending configuration"
 *     and store two_factor_status='unavailable' — we never show a false "enabled" state.
 * See docs/AUTHENTICATION.md.
 */
export function SecureAccountStep({ form, update }: Props) {
  const providerVerified = form.authProvider === 'google' || isEmailVerified()
  const [emailSent, setEmailSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(providerVerified)
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function handleSendVerification() {
    setEmailBusy(true)
    setEmailError(null)
    try {
      await sendVerificationEmail()
      setEmailSent(true)
    } catch {
      setEmailError("Couldn't send the verification email. Please try again.")
    } finally {
      setEmailBusy(false)
    }
  }

  async function handleCheckVerified() {
    setEmailBusy(true)
    try {
      setEmailVerified(await refreshEmailVerified())
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {form.authProvider === 'password' && (
        <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
          <div className="flex items-center gap-2">
            <MailCheck className="size-4 text-muted-foreground" aria-hidden />
            <Body className="font-medium text-foreground">Verify your email</Body>
          </div>
          {emailVerified ? (
            <Small className="text-success">Your email is verified.</Small>
          ) : (
            <>
              <Small className="text-muted-foreground">
                Confirm {form.email || 'your email'} so you can recover your account and receive workspace notifications.
              </Small>
              {emailError && <Caption className="text-danger">{emailError}</Caption>}
              {emailSent && <Caption className="text-muted-foreground">Verification sent — check your inbox, then select “I've verified”.</Caption>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" loading={emailBusy} onClick={handleSendVerification}>
                  {emailSent ? 'Resend email' : 'Send verification email'}
                </Button>
                {emailSent && (
                  <Button size="sm" variant="ghost" loading={emailBusy} onClick={handleCheckVerified}>
                    I've verified
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <TwoFactorCard status={form.twoFactorStatus} accountName={form.email || form.fullName} onStatus={(twoFactorStatus) => update({ twoFactorStatus })} />

      <Caption className="text-subtle-foreground">You can change these anytime in Settings → Security.</Caption>
    </div>
  )
}

function TwoFactorCard({
  status,
  accountName,
  onStatus,
}: {
  status: TwoFactorStatus | null
  accountName: string
  onStatus: (status: TwoFactorStatus) => void
}) {
  const [enrollment, setEnrollment] = useState<TotpEnrollmentStart | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSetup() {
    setBusy(true)
    setError(null)
    try {
      setEnrollment(await startTotpEnrollment(accountName))
    } catch (err) {
      if (err instanceof TwoFactorUnavailableError) {
        onStatus('unavailable')
      } else {
        setError("Couldn't start two-factor setup. Please try again.")
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    if (!enrollment) return
    setBusy(true)
    setError(null)
    try {
      await finalizeTotpEnrollment(enrollment.secret, code)
      setEnrollment(null)
      onStatus('enabled')
    } catch {
      setError("That code didn't match. Check your authenticator app and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <div className="flex items-center gap-2">
        <StatusIcon status={status} />
        <Body className="font-medium text-foreground">Two-factor authentication</Body>
        {status === 'enabled' && <span className="ml-auto text-caption text-success">Enabled</span>}
        {status === 'skipped' && <span className="ml-auto text-caption text-subtle-foreground">Skipped</span>}
        {status === 'unavailable' && <span className="ml-auto text-caption text-warning">Pending setup</span>}
      </div>

      <Small className="text-muted-foreground">
        Protect your account with a time-based code from an authenticator app. Recommended for every workspace owner.
      </Small>

      {/* Dev-only heads-up: 2FA needs Firebase Identity Platform (a console change) before enrollment
          can succeed. Until then, use "Skip for now". Compiled out of production builds. */}
      {import.meta.env.DEV && status !== 'enabled' && (
        <Caption className="rounded-md border border-warning/30 bg-warning-muted px-2.5 py-1.5 text-warning">
          Developer note: two-factor isn't fully configured yet (needs Firebase Identity Platform / MFA enabled).
          Setup will fail — use <span className="font-medium">Skip for now</span> to continue. See docs/AUTHENTICATION.md.
        </Caption>
      )}

      {error && <Caption className="text-danger">{error}</Caption>}

      {status === 'unavailable' && (
        <Alert
          variant="warning"
          title="Two-factor isn't enabled for this project yet"
          description="An administrator needs to turn on multi-factor authentication in the Firebase Console (Identity Platform). Until then this is saved as pending — you can enable it from Settings once it's configured. See docs/AUTHENTICATION.md."
          className="text-left"
        />
      )}

      {enrollment ? (
        <div className="flex flex-col gap-3">
          <Small className="text-muted-foreground">
            Add this key to your authenticator app (or scan the QR from the URL), then enter the 6-digit code it shows.
          </Small>
          <CodeBlock code={enrollment.sharedSecretKey} />
          <FormField label="6-digit code">
            {(field) => (
              <Input
                {...field}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            )}
          </FormField>
          <div className="flex gap-2">
            <Button size="sm" loading={busy} disabled={code.length !== 6} onClick={handleVerify}>
              Verify & enable
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEnrollment(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        status !== 'enabled' && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" loading={busy} onClick={handleSetup}>
              Set up authenticator app
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onStatus('skipped')}>
              Skip for now
            </Button>
          </div>
        )
      )}
    </section>
  )
}

function StatusIcon({ status }: { status: TwoFactorStatus | null }) {
  if (status === 'enabled') return <ShieldCheck className="size-4 text-success" aria-hidden />
  if (status === 'unavailable') return <ShieldAlert className="size-4 text-warning" aria-hidden />
  return <ShieldQuestion className="size-4 text-muted-foreground" aria-hidden />
}
