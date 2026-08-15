'use client'

/**
 * Browser Firebase entry point (the structural seam the migration brief requires). Re-exports the
 * copied Web SDK accessors so consumers can depend on one `@/lib/firebase/client` surface rather
 * than the individual app/auth/firestore/storage modules. CLIENT ONLY — the trusted-server
 * counterpart is @/server/firebase/admin (never import that from a client component).
 *
 * The individual modules (app.ts, auth.ts, …) are retained because the copied Vite code imports
 * them directly; over time those imports can be pointed here.
 */
export { getFirebaseApp } from './app'
export { getFirebaseAuth } from './auth'
export { getDb } from './firestore'
export { getFirebaseStorage } from './storage'
