/**
 * Pure validation helpers for onboarding — no React, no Firebase — so every rule is unit-testable.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/** Firestore/lookup-safe email key: trimmed + lowercased. Also what we store as normalized_email. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export type PasswordStrength = 'weak' | 'fair' | 'strong'

export interface PasswordAssessment {
  strength: PasswordStrength
  /** True only when the password clears the minimum bar Firebase Auth accepts (>= 6 chars). */
  acceptable: boolean
}

/** Firebase Auth requires >= 6 chars. We add a soft strength meter on top for UX (not enforced). */
export function assessPassword(password: string): PasswordAssessment {
  const acceptable = password.length >= 6
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const strength: PasswordStrength = score >= 4 ? 'strong' : score >= 2 ? 'fair' : 'weak'
  return { strength, acceptable }
}

export interface AccountFieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  consent?: string
}

/** Validates the email/password account-creation form (step 1 for password users). */
export function validateAccountStep(fields: {
  name: string
  email: string
  password: string
  confirmPassword: string
  consent: boolean
}): AccountFieldErrors {
  const errors: AccountFieldErrors = {}
  if (!fields.name.trim()) errors.name = 'Your name is required.'
  if (!fields.email.trim()) errors.email = 'Email is required.'
  else if (!isValidEmail(fields.email)) errors.email = 'Enter a valid email address.'
  if (!fields.password) errors.password = 'Password is required.'
  else if (!assessPassword(fields.password).acceptable) errors.password = 'Use at least 6 characters.'
  if (!fields.confirmPassword) errors.confirmPassword = 'Please re-enter your password.'
  else if (fields.password !== fields.confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  if (!fields.consent) errors.consent = 'Please accept the Terms and Privacy Policy to continue.'
  return errors
}

export function hasErrors<T extends object>(errors: T): boolean {
  return Object.values(errors).some(Boolean)
}

export type InviteValidationCode =
  | 'ok'
  | 'invalid'
  | 'self'
  | 'duplicate'
  | 'already-member'
  | 'already-invited'

export interface InviteValidationContext {
  currentUserEmail: string
  pendingEmails: string[]
  memberEmails?: string[]
  existingInviteEmails?: string[]
}

/**
 * Validates a single invite email against every rule the spec calls for. Returns a machine code so
 * the UI can map to a human message and so it's unit-testable.
 */
export function validateInviteEmail(rawEmail: string, ctx: InviteValidationContext): InviteValidationCode {
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) return 'invalid'
  if (email === normalizeEmail(ctx.currentUserEmail)) return 'self'
  if (ctx.pendingEmails.map(normalizeEmail).includes(email)) return 'duplicate'
  if ((ctx.memberEmails ?? []).map(normalizeEmail).includes(email)) return 'already-member'
  if ((ctx.existingInviteEmails ?? []).map(normalizeEmail).includes(email)) return 'already-invited'
  return 'ok'
}

export const INVITE_ERROR_MESSAGE: Record<Exclude<InviteValidationCode, 'ok'>, string> = {
  invalid: 'Enter a valid email address.',
  self: "That's your own email — you're already the owner.",
  duplicate: "You've already added that email.",
  'already-member': 'That person is already a member of this workspace.',
  'already-invited': 'That person already has a pending invitation.',
}
