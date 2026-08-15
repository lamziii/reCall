'use client'

/**
 * Dev-only Firebase/Functions integration diagnostics. Makes the browser→backend config obvious so a
 * misconfiguration (e.g. AI function URLs silently resolving to a non-deployed cloud endpoint → 404,
 * the exact bug that broke the Vite→Next migration) is loud instead of silent.
 *
 * SAFE: never logs ID tokens, secrets, or Admin credentials — only booleans, the (public) project id,
 * region, and resolved endpoint URLs. No-ops in production.
 */
import { getFirebaseAuth } from './auth'
import {
  firebaseConfig,
  functionsRegion,
  extractReviewUrl,
  transcribeUrl,
  transcribeVoiceUrl,
  recallAiChatUrl,
  isFirebaseConfigured,
} from './config'

const isDev = process.env.NODE_ENV !== 'production'

/** Warns if required PUBLIC Firebase config is missing (so we never build malformed request URLs). */
export function assertPublicFirebaseConfig(): void {
  if (!isFirebaseConfigured()) {
    // eslint-disable-next-line no-console
    console.error(
      '[recall-firebase] Missing required public Firebase config (NEXT_PUBLIC_FIREBASE_API_KEY / ' +
        'PROJECT_ID / APP_ID). Set them in web/.env.local — see docs/ENVIRONMENT.md.',
    )
  }
}

let logged = false

/** Logs a one-time integration summary in dev. Call from a client mount effect. */
export async function logFirebaseDiagnostics(): Promise<void> {
  if (!isDev || logged) return
  logged = true
  assertPublicFirebaseConfig()

  const endpoints = {
    extractSessionReview: extractReviewUrl,
    transcribeSession: transcribeUrl,
    transcribeVoice: transcribeVoiceUrl,
    recallAiChat: recallAiChatUrl,
  }

  // The migration bug: on localhost, AI endpoints pointing at deployed cloudfunctions.net (instead of
  // the local emulator or a real deployment) 404 silently. Flag that combination explicitly.
  const onLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  const anyDeployed = Object.values(endpoints).some((u) => u.includes('cloudfunctions.net'))
  if (onLocalhost && anyDeployed) {
    // eslint-disable-next-line no-console
    console.warn(
      '[recall-firebase] Running on localhost but some AI function URLs point at deployed ' +
        'cloudfunctions.net. If those functions are not deployed, AI/transcription will 404. Set ' +
        'NEXT_PUBLIC_FIREBASE_*_URL to the local emulator (http://127.0.0.1:5001/...) in web/.env.local.',
    )
  }

  let userPresent = false
  let tokenObtainable = false
  try {
    const user = getFirebaseAuth().currentUser
    userPresent = Boolean(user)
    if (user) {
      const token = await user.getIdToken()
      tokenObtainable = typeof token === 'string' && token.length > 0 // NEVER log the token itself
    }
  } catch {
    /* ignore — reported as false below */
  }

  // eslint-disable-next-line no-console
  console.info('[recall-firebase] integration diagnostics', {
    projectId: firebaseConfig.projectId,
    functionsRegion,
    endpoints,
    authUserPresent: userPresent,
    idTokenObtainable: tokenObtainable,
  })
}
