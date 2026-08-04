import type { FirebaseOptions } from 'firebase/app'

/**
 * Firebase web config. These values are NOT secrets (they identify the project to Firebase's
 * public APIs — access is controlled by Security Rules, not by hiding these). They are safe to
 * commit, so we ship the real project's config as the default and let VITE_FIREBASE_* env vars
 * override it for a different project. See firebase/web-app-config.js.
 *
 * The Anthropic API key is the opposite — it is a real secret and lives ONLY server-side
 * (firebase/functions/.env locally, or the deploy env / Secret Manager in production), never in
 * any VITE_ variable or frontend bundle.
 */
const env = import.meta.env

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCyJdoW4zT6d-xaucU9u7cNt4RHsmTzF9I',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'recall-ca1ec.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'recall-ca1ec',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'recall-ca1ec.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '164858424265',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:164858424265:web:d1fe1c791d74f9d0895618',
}

export const functionsRegion = env.VITE_FIREBASE_FUNCTIONS_REGION ?? 'us-central1'

/**
 * Opt-in local mode: run against the Firebase Emulator Suite (auth/firestore/storage/functions)
 * so the whole flow — including the Anthropic-calling function reading firebase/functions/.env —
 * works locally with no Blaze plan. Enable with VITE_USE_EMULATORS=true in dev only.
 */
export const useEmulators = import.meta.env.DEV && env.VITE_USE_EMULATORS === 'true'

/** Emulator host/ports — must match firebase/firebase.json. */
export const emulatorConfig = {
  host: '127.0.0.1',
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  functions: 5001,
}

/**
 * URL of the extractSessionReview Cloud Function. Explicit override wins; otherwise it points at
 * the local Functions emulator when VITE_USE_EMULATORS is on, else the deployed HTTPS URL.
 */
export const extractReviewUrl =
  env.VITE_FIREBASE_EXTRACT_REVIEW_URL ??
  (useEmulators
    ? `http://${emulatorConfig.host}:${emulatorConfig.functions}/${firebaseConfig.projectId}/${functionsRegion}/extractSessionReview`
    : `https://${functionsRegion}-${firebaseConfig.projectId}.cloudfunctions.net/extractSessionReview`)

/** URL of the transcribeSession Cloud Function. Same resolution rule as above. */
export const transcribeUrl =
  env.VITE_FIREBASE_TRANSCRIBE_URL ??
  (useEmulators
    ? `http://${emulatorConfig.host}:${emulatorConfig.functions}/${firebaseConfig.projectId}/${functionsRegion}/transcribeSession`
    : `https://${functionsRegion}-${firebaseConfig.projectId}.cloudfunctions.net/transcribeSession`)

/** URL of the benchmarkTranscription Cloud Function (internal provider comparison tool). Same rule. */
export const benchmarkTranscriptionUrl =
  env.VITE_FIREBASE_BENCHMARK_URL ??
  (useEmulators
    ? `http://${emulatorConfig.host}:${emulatorConfig.functions}/${firebaseConfig.projectId}/${functionsRegion}/benchmarkTranscription`
    : `https://${functionsRegion}-${firebaseConfig.projectId}.cloudfunctions.net/benchmarkTranscription`)

/** Build-time flag to run the app in sample-data/demo mode with no auth (see DataMode). */
export const forceDemoMode = env.VITE_RECALL_DEMO === 'true'

/** True when the minimum config needed to talk to Firebase is present. */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}

/** Throws a developer-friendly error when config is missing — call this before init in live mode. */
export function assertFirebaseConfigured(): void {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID and ' +
        'VITE_FIREBASE_APP_ID in frontend/.env.local (see .env.example), or run with ' +
        'VITE_RECALL_DEMO=true for sample-data mode.',
    )
  }
}
