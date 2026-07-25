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
import { signInWithGoogle, signInWithPassword, AuthCancelledError } from '@/lib/auth/auth-service'

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  return errors
}

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const busy = isGoogleLoading || isFormLoading

  function onSignedIn(name: string) {
    toast({ title: 'Signed in', description: `Welcome back, ${name}.`, variant: 'success' })
    navigate('/app')
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

  async function handlePasswordSignIn(event: FormEvent) {
    event.preventDefault()
    const errors = validate(email, password)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setError(null)
    setIsFormLoading(true)
    try {
      const result = await signInWithPassword(email, password)
      onSignedIn(result.user.name)
    } catch {
      setError('Incorrect email or password. Please try again.')
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
          <Label as="span">Welcome back</Label>
          <H2>Sign in to Recall</H2>
          <Body className="text-muted-foreground">Sign in to access your workspace.</Body>
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

          <form className="flex flex-col gap-4" onSubmit={handlePasswordSignIn} noValidate>
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

            <Button type="submit" fullWidth loading={isFormLoading} disabled={busy} className="h-[52px] text-body">
              {isFormLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

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
