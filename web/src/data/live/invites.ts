import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { normalizeEmail } from '@/views/onboarding/validation'
import type { InviteRole } from '@/views/onboarding/options'

/**
 * Workspace invitations (`workspace_invites/{inviteId}`). The invite doc is the persistence +
 * acceptance boundary; actual email delivery is a Cloud Function seam that is NOT configured yet
 * (see firebase/functions/src/invites.ts and docs/AUTHENTICATION.md) — we never claim an email was
 * sent, only that the invitation was created.
 *
 * Security is enforced in firestore.rules: only the workspace OWNER may create an invite, the role
 * is constrained to admin|member (never owner — a client cannot escalate itself), and only members
 * or the invited email may read it.
 */

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface InviteDoc {
  id: string
  workspace_id: string
  email: string
  normalized_email: string
  role: InviteRole
  status: InviteStatus
  invited_by_user_id: string
  invited_by_name: string
}

const INVITE_TTL_DAYS = 14

/**
 * Deterministic invite id from workspace + normalized email ⇒ re-inviting the same address writes
 * the same doc instead of creating duplicates (idempotent). Firestore ids may not contain '/', so
 * we substitute any unsafe char.
 */
export function inviteIdFor(workspaceId: string, email: string): string {
  const key = normalizeEmail(email).replace(/[^a-z0-9._-]/g, '_')
  return `${workspaceId}__${key}`
}

export interface CreateInviteInput {
  workspaceId: string
  email: string
  role: InviteRole
  invitedByUserId: string
  invitedByName: string
}

/** Creates (or refreshes) a pending invitation. Idempotent on the deterministic id. */
export async function createInvite(input: CreateInviteInput): Promise<string> {
  const db = getDb()
  const normalized = normalizeEmail(input.email)
  const id = inviteIdFor(input.workspaceId, input.email)
  const expiresAt = Timestamp.fromMillis(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  await setDoc(doc(db, 'workspace_invites', id), {
    workspace_id: input.workspaceId,
    email: input.email.trim(),
    normalized_email: normalized,
    role: input.role,
    status: 'pending',
    invited_by_user_id: input.invitedByUserId,
    invited_by_name: input.invitedByName,
    created_at: serverTimestamp(),
    expires_at: expiresAt,
  })
  return id
}

/** Creates many invites, returning per-email success/failure so the UI can report partial results. */
export async function createInvites(
  workspaceId: string,
  invites: { email: string; role: InviteRole }[],
  invitedBy: { userId: string; name: string },
): Promise<{ email: string; ok: boolean; error?: unknown }[]> {
  return Promise.all(
    invites.map(async ({ email, role }) => {
      try {
        await createInvite({ workspaceId, email, role, invitedByUserId: invitedBy.userId, invitedByName: invitedBy.name })
        return { email, ok: true }
      } catch (error) {
        return { email, ok: false, error }
      }
    }),
  )
}

/** Normalized emails of the workspace's existing pending invites (used to block re-inviting). */
export async function getPendingInviteEmails(workspaceId: string): Promise<string[]> {
  try {
    const q = query(
      collection(getDb(), 'workspace_invites'),
      where('workspace_id', '==', workspaceId),
      where('status', '==', 'pending'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => (d.data() as InviteDoc).normalized_email)
  } catch {
    return []
  }
}

/** Owner-only: revoke a pending invite. */
export async function revokeInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(getDb(), 'workspace_invites', inviteId), { status: 'revoked', updated_at: serverTimestamp() })
}

export async function loadInvite(inviteId: string): Promise<InviteDoc | null> {
  const snap = await getDoc(doc(getDb(), 'workspace_invites', inviteId))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as InviteDoc) : null
}
