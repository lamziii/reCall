import 'server-only'

/**
 * Trusted-server Firebase (firebase-admin). SERVER ONLY.
 *
 * The `server-only` import above makes the build FAIL LOUDLY if any client component ever imports
 * this file — the guardrail the brief requires (admin credentials must never reach the browser).
 *
 * This is a PLACEHOLDER / seam for a future custom backend. Nothing in this phase uses it: all
 * privileged Firestore access, AI, and transcription still live in Firebase Cloud Functions and is
 * NOT being migrated now. It exists so the client/server Firebase separation is structurally in
 * place from day one.
 *
 * When first used, provide credentials via a SERVER-ONLY env var (e.g. FIREBASE_SERVICE_ACCOUNT as
 * JSON, or GOOGLE_APPLICATION_CREDENTIALS) — never a NEXT_PUBLIC_* variable.
 */
import { getApps, initializeApp, cert, applicationDefault, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) {
    return initializeApp({ credential: cert(JSON.parse(raw)) })
  }
  // Falls back to Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).
  return initializeApp({ credential: applicationDefault() })
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
