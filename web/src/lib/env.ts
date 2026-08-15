/**
 * Env shim — the Next replacement for the Vite app's `import.meta.env` reads.
 *
 * Firebase *web* config values are NOT secrets (they identify the project to public Firebase APIs;
 * access is controlled by Security Rules, not by hiding them), so we ship the real project's config
 * as defaults and let NEXT_PUBLIC_FIREBASE_* override for a different project — mirroring
 * frontend/src/lib/firebase/config.ts exactly.
 *
 * Real secrets (Anthropic/OpenAI/Speechmatics keys, service account) are SERVER-ONLY and must never
 * appear here or in any NEXT_PUBLIC_* variable — they stay in Firebase Functions this phase.
 */
const pub = process.env

export const firebaseConfig = {
  apiKey: pub.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyCyJdoW4zT6d-xaucU9u7cNt4RHsmTzF9I',
  authDomain: pub.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'recall-ca1ec.firebaseapp.com',
  projectId: pub.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'recall-ca1ec',
  storageBucket: pub.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'recall-ca1ec.firebasestorage.app',
  messagingSenderId: pub.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '164858424265',
  appId: pub.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:164858424265:web:d1fe1c791d74f9d0895618',
}

export const functionsRegion = pub.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? 'us-central1'

/** Replaces `(process.env.NODE_ENV !== 'production')`. */
export const isDev = process.env.NODE_ENV !== 'production'

/** Build-time demo flag (localStorage sample data, no auth) — parity with VITE_RECALL_DEMO. */
export const forceDemoMode = pub.NEXT_PUBLIC_RECALL_DEMO === 'true'

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}
