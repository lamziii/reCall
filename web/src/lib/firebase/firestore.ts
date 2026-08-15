import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { getFirebaseApp } from './app'
import { emulatorConfig } from './config'
import { connectEmulatorOnce } from './emulators'

let cached: Firestore | null = null

export function getDb(): Firestore {
  if (cached) return cached
  const db = getFirestore(getFirebaseApp())
  connectEmulatorOnce('firestore', () => connectFirestoreEmulator(db, emulatorConfig.host, emulatorConfig.firestore))
  cached = db
  return db
}
