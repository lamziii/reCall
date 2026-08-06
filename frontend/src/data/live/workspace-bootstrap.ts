import { doc, getDoc, serverTimestamp, setDoc, type DocumentReference } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import type { AuthUser } from '@/lib/auth/auth-service'

/** The deterministic workspace id for a user. Deterministic ⇒ bootstrap and onboarding always
 *  resolve to the SAME document, so a workspace can never be duplicated across refreshes/tabs. */
export function workspaceIdForUser(uid: string): string {
  return `ws-${uid}`
}

/**
 * Whether a doc exists, treating a DENIED read as "does not exist yet". A brand-new user is not yet
 * a workspace member, and the workspace read rule requires membership — so the very first read of
 * their (not-yet-created) workspace is permission-denied. We must not let that reject bootstrap;
 * it just means "needs creating".
 */
async function docExistsOrTreatMissing(ref: DocumentReference): Promise<boolean> {
  try {
    return (await getDoc(ref)).exists()
  } catch {
    return false
  }
}

/** Handoff key: the workspace name a user typed at sign-up, consumed once when the workspace is
 *  first created (see auth-service signUpWithPassword). Cleared after use. */
const PENDING_WORKSPACE_KEY = 'recall:pending-workspace-name'

/**
 * Idempotently ensures the user's workspace, owner membership, and canonical `users/{uid}` profile
 * exist. Creates them on first run; never overwrites existing data (so it is safe to call on every
 * `/app` entry AND at the start of onboarding). This is the RECOVERY / FALLBACK path — the source
 * of truth for the workspace's descriptive fields (name/type/…) and for onboarding completion is
 * the onboarding flow (see data/live/onboarding.ts). Returns the workspace id.
 *
 * The owner membership is created client-side rather than depending only on the onWorkspaceCreated
 * Cloud Function trigger, removing the race where the first session write fails because the trigger
 * hadn't run yet. firestore.rules permits an owner to self-enroll (owner_id === uid, role 'owner').
 */
export async function ensureWorkspace(user: AuthUser): Promise<string> {
  const db = getDb()
  const workspaceId = workspaceIdForUser(user.id)

  const pendingName = typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_WORKSPACE_KEY)?.trim() : null

  // Create the workspace first (create is allowed for any signed-in user). The read is denied for a
  // brand-new, not-yet-member user, which docExistsOrTreatMissing turns into "create it".
  const wsRef = doc(db, 'workspaces', workspaceId)
  if (!(await docExistsOrTreatMissing(wsRef))) {
    await setDoc(wsRef, {
      name: pendingName || `${user.name}'s Workspace`,
      owner_id: user.id,
      onboarding_completed: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
  }
  if (pendingName && typeof window !== 'undefined') window.localStorage.removeItem(PENDING_WORKSPACE_KEY)

  // Then self-enroll as owner. The workspace now exists, so the self-enroll rule (owner_id === uid,
  // role 'owner') passes. The member read is also denied pre-membership → treat as "create it".
  const memberRef = doc(db, 'workspaces', workspaceId, 'members', user.id)
  if (!(await docExistsOrTreatMissing(memberRef))) {
    await setDoc(memberRef, { role: 'owner', created_at: serverTimestamp() })
  }

  // Canonical user profile (users/{uid}). Idempotent: created once, never overwrites edits.
  // BEST-EFFORT: a permission error (e.g. the users/{uid} rule not yet deployed) must NEVER block
  // opening the workspace. Failure is logged, not thrown.
  try {
    const userRef = doc(db, 'users', user.id)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      const [firstName, ...rest] = (user.name || '').trim().split(/\s+/)
      await setDoc(userRef, {
        uid: user.id,
        display_name: user.name || null,
        first_name: firstName || null,
        last_name: rest.join(' ') || null,
        email: user.email || null,
        photo_url: user.photoURL ?? null,
        workspace_id: workspaceId,
        role: 'owner',
        onboarding_status: 'not_started',
        onboarding_step: 0,
        onboarding_completed: false,
        tutorial_completed: false,
        two_factor_status: null,
        use_cases: [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    }
  } catch (err) {
    console.warn('ensureWorkspace: user profile write skipped (deploy the users/{uid} Firestore rule to persist it)', err)
  }

  return workspaceId
}

/**
 * Back-compat alias. Older callers imported `bootstrapWorkspace`; it is exactly `ensureWorkspace`.
 * @deprecated use ensureWorkspace
 */
export const bootstrapWorkspace = ensureWorkspace
