import { doc, getDoc, serverTimestamp, setDoc, type DocumentReference } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import type { AuthUser } from '@/lib/auth/auth-service'

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

/**
 * Resolves the user's workspace, creating a personal one on first run.
 *
 * The workspace ID is derived deterministically from the user's uid, which makes the whole
 * operation idempotent: repeated refreshes (and React StrictMode's double-invoked effects in
 * dev) re-run this without ever creating a second workspace or membership.
 *
 * We also create the owner membership client-side rather than depending only on the
 * onWorkspaceCreated Cloud Function trigger — this removes the race where the first session
 * write would fail because the trigger hadn't run yet. firestore.rules permits an owner to
 * self-enroll (owner_id === uid, role 'owner'), so this is safe; the trigger remains as a
 * redundant backstop.
 */
/** Handoff key: the workspace name a user typed at sign-up, consumed once when the workspace is
 *  first created (see auth-service signUpWithPassword). Cleared after use. */
const PENDING_WORKSPACE_KEY = 'recall:pending-workspace-name'

export async function bootstrapWorkspace(user: AuthUser): Promise<string> {
  const db = getDb()
  const workspaceId = `ws-${user.id}`

  const pendingName = typeof window !== 'undefined' ? window.localStorage.getItem(PENDING_WORKSPACE_KEY)?.trim() : null

  // Create the workspace first (create is allowed for any signed-in user). The read is denied for a
  // brand-new, not-yet-member user, which docExistsOrTreatMissing turns into "create it".
  const wsRef = doc(db, 'workspaces', workspaceId)
  if (!(await docExistsOrTreatMissing(wsRef))) {
    await setDoc(wsRef, {
      name: pendingName || `${user.name}'s Workspace`,
      owner_id: user.id,
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
  // BEST-EFFORT: the profile is display-only; a permission error (e.g. the users/{uid} rule not yet
  // deployed) must NEVER block opening the workspace. Failure is logged, not thrown.
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
        onboarding_completed: false,
        tutorial_completed: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    }
  } catch (err) {
    console.warn('bootstrapWorkspace: user profile write skipped (deploy the users/{uid} Firestore rule to persist it)', err)
  }

  return workspaceId
}
