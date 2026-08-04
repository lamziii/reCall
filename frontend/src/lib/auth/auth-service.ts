import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/auth'
import { forceDemoMode } from '@/lib/firebase/config'

export interface AuthUser {
  id: string
  name: string
  email: string
  photoURL?: string
}

export interface AuthResult {
  user: AuthUser
}

export class AuthCancelledError extends Error {
  constructor() {
    super('Sign-in was cancelled.')
    this.name = 'AuthCancelledError'
  }
}

/** The synthetic user used in demo mode (VITE_RECALL_DEMO=true) — no real auth. */
export const DEMO_USER: AuthUser = { id: 'demo-user', name: 'Recall Demo', email: 'demo@recall.app' }

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Recall User',
    email: user.email ?? '',
    photoURL: user.photoURL ?? undefined,
  }
}

// Errors that mean "the user closed the popup" — treated as a cancel, not a failure.
const CANCEL_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
])

export async function signInWithGoogle(): Promise<AuthResult> {
  if (forceDemoMode) {
    await new Promise((r) => setTimeout(r, 400))
    return { user: DEMO_USER }
  }

  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  try {
    const cred = await signInWithPopup(auth, provider)
    return { user: toAuthUser(cred.user) }
  } catch (err) {
    const code = (err as { code?: string }).code ?? ''
    if (CANCEL_CODES.has(code)) throw new AuthCancelledError()
    // Popups are commonly blocked; fall back to a full-page redirect. This navigates away,
    // so the returned promise never resolves — the redirect result is picked up on reload.
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider)
      return new Promise<AuthResult>(() => {})
    }
    throw err
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) throw new Error('Email and password are required.')
  if (forceDemoMode) {
    await new Promise((r) => setTimeout(r, 400))
    return { user: { ...DEMO_USER, email, name: email.split('@')[0] || DEMO_USER.name } }
  }
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  return { user: toAuthUser(cred.user) }
}

/**
 * Creates an email/password account, sets the display name, and stashes the workspace name the user
 * typed so bootstrapWorkspace can apply it once. The users/{uid} profile + workspace are created
 * idempotently on first entry to /app (WorkspaceProvider → bootstrapWorkspace).
 */
export async function signUpWithPassword(params: { name: string; email: string; password: string; workspaceName?: string }): Promise<AuthResult> {
  const { name, email, password, workspaceName } = params
  if (!email || !password) throw new Error('Email and password are required.')
  const cleanName = name.trim() || email.split('@')[0]
  if (typeof window !== 'undefined' && workspaceName?.trim()) {
    window.localStorage.setItem('recall:pending-workspace-name', workspaceName.trim())
  }
  if (forceDemoMode) {
    await new Promise((r) => setTimeout(r, 400))
    return { user: { ...DEMO_USER, email, name: cleanName } }
  }
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  await updateProfile(cred.user, { displayName: cleanName })
  return { user: { id: cred.user.uid, name: cleanName, email: cred.user.email ?? email, photoURL: cred.user.photoURL ?? undefined } }
}

/** Maps a Firebase Auth error code to a short, user-safe message for the login/sign-up form. */
export function authErrorMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: string }).code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Choose a stronger password (at least 6 characters).'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.'
    case 'auth/user-not-found':
      return 'No account found for this email.'
    case 'auth/network-request-failed':
      return "Couldn't reach the server. Check your connection and try again."
    default:
      return fallback
  }
}

export async function signOutUser(): Promise<void> {
  if (forceDemoMode) return
  await signOut(getFirebaseAuth())
}

/**
 * Subscribes to auth state. In demo mode there is no Firebase — immediately reports the demo user.
 *
 * For a real session we force-refresh the ID token on each change. Firebase caches the signed-in
 * user in the browser and does NOT revoke that token when the account is deleted/disabled in the
 * console, so a stale session would otherwise boot a dead account (→ "couldn't open workspace").
 * If the refresh fails because the account is gone, we sign out and report null so the app lands on
 * a clean /login. Network/transient errors keep the cached user (don't lock a valid user out).
 */
export function subscribeToAuth(cb: (user: AuthUser | null) => void): () => void {
  if (forceDemoMode) {
    cb(DEMO_USER)
    return () => {}
  }
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      cb(null)
      return
    }
    try {
      await user.getIdToken(true) // hits Firebase — throws if the account was deleted/disabled/revoked
      cb(toAuthUser(user))
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      const invalidAccount =
        code.startsWith('auth/user-') || code === 'auth/invalid-user-token' || code === 'auth/token-expired' || code === 'auth/invalid-credential'
      if (invalidAccount) {
        await signOut(auth).catch(() => {})
        cb(null)
      } else {
        cb(toAuthUser(user)) // offline/transient — trust the cached user
      }
    }
  })
}
