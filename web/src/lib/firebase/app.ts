import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { assertFirebaseConfigured, firebaseConfig } from './config'

/**
 * Singleton Firebase app. `getApps()` guard keeps Vite HMR from calling initializeApp twice
 * (which throws "Firebase App named '[DEFAULT]' already exists").
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp()
  assertFirebaseConfigured()
  return initializeApp(firebaseConfig)
}
