export interface AuthUser {
  id: string
  name: string
  email: string
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

// ponytail: no auth provider is wired up yet (no Firebase/Supabase/Auth0/Clerk in package.json).
// This is the seam the login page calls through — swap the body for the real Google OAuth
// call once a provider is configured, e.g.:
//   Firebase:  signInWithPopup(auth, new GoogleAuthProvider())
//   Supabase:  supabase.auth.signInWithOAuth({ provider: 'google' })
// Keep the AuthResult/AuthCancelledError contract so the UI doesn't need to change.
export async function signInWithGoogle(): Promise<AuthResult> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return { user: { id: 'mock-user', name: 'Recall User', email: 'you@example.com' } }
}

// ponytail: same mock seam as signInWithGoogle — swap for the real call once a provider
// is configured, e.g. Firebase's signInWithEmailAndPassword(auth, email, password) or
// Supabase's supabase.auth.signInWithPassword({ email, password }).
export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) throw new Error('Email and password are required.')
  await new Promise((resolve) => setTimeout(resolve, 700))
  return { user: { id: 'mock-user', name: email.split('@')[0] || 'Recall User', email } }
}
