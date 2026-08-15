import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'
import { getFirebaseApp } from './app'
import { emulatorConfig } from './config'
import { connectEmulatorOnce } from './emulators'

let cached: FirebaseStorage | null = null

export function getFirebaseStorage(): FirebaseStorage {
  if (cached) return cached
  const storage = getStorage(getFirebaseApp())
  connectEmulatorOnce('storage', () => connectStorageEmulator(storage, emulatorConfig.host, emulatorConfig.storage))
  // Audio upload is best-effort (see record-live.tsx). The SDK's default ~2min retry window makes
  // a failed upload hang the "Saving…" screen; fail fast so the flow falls through to the AI review.
  storage.maxUploadRetryTime = 8000
  storage.maxOperationRetryTime = 8000
  cached = storage
  return storage
}
