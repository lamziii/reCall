import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wordmark, GoogleIcon } from '@/components/branding'
import { Button } from '@/components/ui/button'
import { Alert, useToast } from '@/components/feedback'
import { InlineLink } from '@/components/links'
import { Divider } from '@/components/data-display'
import { FormField, Input, PasswordInput } from '@/components/forms'
import { H2, Body, Caption, Label } from '@/components/typography'
import { signInWithGoogle, signInWithPassword, signUpWithPassword, authErrorMessage, AuthCancelledError } from '@/lib/auth/auth-service'

type Mode = 'signin' | 'signup'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

function validate(mode: Mode, fields: { name: string; email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {}
  if (mode === 'signup' && !fields.name.trim()) errors.name = 'Your name is required.'
  if (!fields.email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Enter a valid email address.'
  if (!fields.password) errors.password = 'Password is required.'
  else if (mode === 'signup' && fields.password.length < 6) errors.password = 'Use at least 6 characters.'
  return errors
}

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>('signin')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const busy = isGoogleLoading || isFormLoading
  const isSignup = mode === 'signup'

  function onSignedIn(displayName: string) {
    toast({ title: isSignup ? 'Account created' : 'Signed in', description: `Welcome${isSignup ? '' : ' back'}, ${displayName}.`, variant: 'success' })
    navigate('/app')
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setFieldErrors({})
  }

  async function handleGoogleSignIn() {
    setError(null)
    setIsGoogleLoading(true)
    try {
      const result = await signInWithGoogle()
      onSignedIn(result.user.name)
    } catch (err) {
      if (err instanceof AuthCancelledError) return
      setError('Something went wrong signing you in. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const errors = validate(mode, { name, email, password })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setError(null)
    setIsFormLoading(true)
    try {
      const result = isSignup
        ? await signUpWithPassword({ name, email, password, workspaceName })
        : await signInWithPassword(email, password)
      onSignedIn(result.user.name)
    } catch (err) {
      setError(authErrorMessage(err, isSignup ? "Couldn't create your account. Please try again." : 'Incorrect email or password. Please try again.'))
    } finally {
      setIsFormLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-bg px-6 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_38%,rgba(255,255,255,0.035),transparent_70%)]"
      />

      <div className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <a href="/" className="focus-ring w-fit rounded-md" aria-label="Recall home">
          <Wordmark size="lg" />
        </a>

        <div className="flex flex-col items-center gap-3 text-center">
          <Label as="span">{isSignup ? 'Get started' : 'Welcome back'}</Label>
          <H2>{isSignup ? 'Create your account' : 'Sign in to Recall'}</H2>
          <Body className="text-muted-foreground">{isSignup ? 'Set up your workspace in seconds.' : 'Sign in to access your workspace.'}</Body>
        </div>

        <div className="flex w-full flex-col gap-5">
          {error && <Alert variant="danger" title={error} className="text-left" />}

          <Button
            variant="secondary"
            fullWidth
            loading={isGoogleLoading}
            disabled={busy}
            onClick={handleGoogleSignIn}
            leftIcon={!isGoogleLoading && <GoogleIcon />}
            className="h-[52px] border-black/10 bg-foreground text-body text-inverse-foreground hover:bg-foreground/90 active:bg-foreground/80"
          >
            {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
          </Button>

          <Divider label="or" />

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <FormField label="Full name" error={fieldErrors.name} required>
                {(field) => (
                  <Input
                    {...field}
                    size="lg"
                    autoComplete="name"
                    placeholder="Veiz Makulovci"
                    error={field['aria-invalid']}
                    value={name}
                    disabled={busy}
                    onChange={(e) => {
                      setName(e.target.value)
                      setFieldErrors((current) => ({ ...current, name: undefined }))
                    }}
                  />
                )}
              </FormField>
            )}

            <FormField label="Email" error={fieldErrors.email} required>
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  size="lg"
                  autoComplete="email"
                  placeholder="you@company.com"
                  error={field['aria-invalid']}
                  value={email}
                  disabled={busy}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldErrors((current) => ({ ...current, email: undefined }))
                  }}
                />
              )}
            </FormField>

            <FormField label="Password" error={fieldErrors.password} required>
              {(field) => (
                <PasswordInput
                  {...field}
                  size="lg"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'}
                  error={field['aria-invalid']}
                  value={password}
                  disabled={busy}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setFieldErrors((current) => ({ ...current, password: undefined }))
                  }}
                />
              )}
            </FormField>

            {isSignup && (
              <FormField label="Workspace name" optional>
                {(field) => (
                  <Input
                    {...field}
                    size="lg"
                    placeholder="e.g. Acme, or your team name"
                    value={workspaceName}
                    disabled={busy}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                  />
                )}
              </FormField>
            )}

            <Button type="submit" fullWidth loading={isFormLoading} disabled={busy} className="h-[52px] text-body">
              {isFormLoading ? (isSignup ? 'Creating account…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <Caption className="text-center text-subtle-foreground">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              className="focus-ring rounded-sm font-medium text-foreground hover:underline"
              onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
              disabled={busy}
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </Caption>

          <Caption className="text-center text-subtle-foreground">
            By continuing, you agree to our{' '}
            <InlineLink to="/terms" className="text-caption">
              Terms
            </InlineLink>{' '}
            and{' '}
            <InlineLink to="/privacy" className="text-caption">
              Privacy Policy
            </InlineLink>
            .
          </Caption>
        </div>
      </div>
    </div>
  )
}
