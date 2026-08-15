import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { GoogleIcon } from '@/components/branding'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/feedback'
import { Divider } from '@/components/data-display'
import { Avatar } from '@/components/data-display/avatar'
import { Checkbox, FormField, Input, PasswordInput } from '@/components/forms'
import { Body, Caption } from '@/components/typography'
import { InlineLink } from '@/components/links'
import {
  signInWithGoogle,
  signUpWithPassword,
  authErrorMessage,
  AuthCancelledError,
  type AuthUser,
  type AuthResult,
} from '@/lib/auth/auth-service'
import { assessPassword, validateAccountStep, hasErrors, type AccountFieldErrors } from '../validation'
import type { AuthProvider } from '@/data/live/onboarding'
import type { OnboardingForm } from '../types'

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
  authedUser: AuthUser | null
  onAuthenticated: (provider: AuthProvider, result: AuthResult) => void
}

const STRENGTH_LABEL = { weak: 'Weak', fair: 'Fair', strong: 'Strong' } as const
const STRENGTH_TONE = { weak: 'text-danger', fair: 'text-warning', strong: 'text-success' } as const

/**
 * Step 1. For an unauthenticated visitor this creates the Firebase account (email/password or
 * Google). For an already-authenticated user it confirms their identity (no password fields). The
 * orchestrator drives the Continue button once the user is authenticated.
 */
export function CreateAccountStep({ form, update, authedUser, onAuthenticated }: Props) {
  const [errors, setErrors] = useState<AccountFieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const busy = googleLoading || formLoading

  // ---- Authenticated: confirm identity --------------------------------------
  if (authedUser) {
    const provider = form.authProvider === 'google' ? 'Google' : 'email'
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
          <Avatar name={authedUser.name} src={authedUser.photoURL} size="lg" />
          <div className="flex min-w-0 flex-col">
            <Body className="truncate font-medium text-foreground">{authedUser.name}</Body>
            <Caption className="truncate text-subtle-foreground">{authedUser.email}</Caption>
          </div>
          <span className="ml-auto flex items-center gap-1 text-caption text-success">
            <CheckCircle2 className="size-4" aria-hidden /> Signed in
          </span>
        </div>

        <FormField label="Your name" labelClassName="font-normal text-muted-foreground">
          {(field) => (
            <Input
              {...field}
              size="lg"
              value={form.fullName}
              onChange={(e) => update({ fullName: e.target.value })}
              placeholder="Your full name"
            />
          )}
        </FormField>

        <Caption className="text-subtle-foreground">You're signed in with {provider}. Continue to set up your workspace.</Caption>
      </div>
    )
  }

  // ---- Unauthenticated: create account --------------------------------------
  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    try {
      const result = await signInWithGoogle()
      onAuthenticated('google', result)
    } catch (err) {
      if (!(err instanceof AuthCancelledError)) setError('Something went wrong signing you in. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateAccountStep({
      name: form.fullName,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      consent: form.consent,
    })
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setError(null)
    setFormLoading(true)
    try {
      const result = await signUpWithPassword({
        name: form.fullName,
        email: form.email,
        password: form.password,
        workspaceName: form.workspaceName,
      })
      onAuthenticated('password', result)
    } catch (err) {
      setError(authErrorMessage(err, "Couldn't create your account. Please try again."))
    } finally {
      setFormLoading(false)
    }
  }

  const strength = form.password ? assessPassword(form.password).strength : null

  return (
    <div className="flex flex-col gap-5">
      {error && <Alert variant="danger" title={error} className="text-left" />}

      <Button
        variant="secondary"
        fullWidth
        loading={googleLoading}
        disabled={busy}
        onClick={handleGoogle}
        leftIcon={!googleLoading && <GoogleIcon />}
        className="h-[52px] border-black/10 bg-foreground text-body text-inverse-foreground hover:bg-foreground/90 active:bg-foreground/80"
      >
        {googleLoading ? 'Signing in…' : 'Continue with Google'}
      </Button>

      <Divider label="or sign up with email" />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" error={errors.name} required>
          {(field) => (
            <Input
              {...field}
              size="lg"
              autoComplete="name"
              placeholder="Veiz Makulovci"
              error={field['aria-invalid']}
              value={form.fullName}
              disabled={busy}
              onChange={(e) => {
                update({ fullName: e.target.value })
                setErrors((c) => ({ ...c, name: undefined }))
              }}
            />
          )}
        </FormField>

        <FormField label="Email" error={errors.email} required>
          {(field) => (
            <Input
              {...field}
              type="email"
              size="lg"
              autoComplete="email"
              placeholder="you@company.com"
              error={field['aria-invalid']}
              value={form.email}
              disabled={busy}
              onChange={(e) => {
                update({ email: e.target.value })
                setErrors((c) => ({ ...c, email: undefined }))
              }}
            />
          )}
        </FormField>

        <FormField label="Password" error={errors.password} required>
          {(field) => (
            <PasswordInput
              {...field}
              size="lg"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              error={field['aria-invalid']}
              value={form.password}
              disabled={busy}
              onChange={(e) => {
                update({ password: e.target.value })
                setErrors((c) => ({ ...c, password: undefined }))
              }}
            />
          )}
        </FormField>
        {strength && !errors.password && (
          <Caption className={`-mt-2 ${STRENGTH_TONE[strength]}`}>Password strength: {STRENGTH_LABEL[strength]}</Caption>
        )}

        <FormField label="Confirm password" error={errors.confirmPassword} required>
          {(field) => (
            <PasswordInput
              {...field}
              size="lg"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={field['aria-invalid']}
              value={form.confirmPassword}
              disabled={busy}
              onChange={(e) => {
                update({ confirmPassword: e.target.value })
                setErrors((c) => ({ ...c, confirmPassword: undefined }))
              }}
            />
          )}
        </FormField>

        <div className="flex flex-col gap-1">
          <Checkbox
            checked={form.consent}
            disabled={busy}
            onChange={(e) => {
              update({ consent: e.target.checked })
              setErrors((c) => ({ ...c, consent: undefined }))
            }}
            label={
              <span className="text-small text-muted-foreground">
                I agree to Recall's <InlineLink to="/terms" className="text-small">Terms</InlineLink> and{' '}
                <InlineLink to="/privacy" className="text-small">Privacy Policy</InlineLink>.
              </span>
            }
          />
          {errors.consent && <Caption className="text-danger">{errors.consent}</Caption>}
        </div>

        <Button type="submit" fullWidth loading={formLoading} disabled={busy} className="h-[52px] text-body">
          {formLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <Caption className="text-center text-subtle-foreground">
        Already have an account? <InlineLink to="/login" className="text-caption">Sign in</InlineLink>
      </Caption>
    </div>
  )
}
