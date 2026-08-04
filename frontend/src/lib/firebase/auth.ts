import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { getFirebaseApp } from './app'
import { emulatorConfig } from './config'
import { connectEmulatorOnce } from './emulators'

let cached: Auth | null = null

/**
 * Singleton Auth. Uses local persistence so the session survives a refresh (part of the
 * acceptance test). setPersistence resolves before the first sign-in call resolves, so callers
 * that await sign-in get persistence applied.
 */
export function getFirebaseAuth(): Auth {
  if (cached) return cached
  const auth = getAuth(getFirebaseApp())
  connectEmulatorOnce('auth', () =>
    connectAuthEmulator(auth, `http://${emulatorConfig.host}:${emulatorConfig.auth}`, { disableWarnings: true }),
  )
  // Fire-and-forget: local persistence is the default in browsers, this just makes it explicit
  // and re-applies it if a prior call changed it. Errors are non-fatal.
  void setPersistence(auth, browserLocalPersistence).catch(() => {})
  cached = auth
  return auth
}
