import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'

/**
 * "Contact support" submissions from the Help Center (`support_requests/{requestId}`). The
 * request doc is the persistence boundary; actual email delivery is a Cloud Function seam that is
 * NOT configured yet (see firebase/functions/src/support.ts and firebase/FIREBASE_SCHEMA.md) —
 * callers should only ever tell the user their message was received, never that it was emailed.
 */

export type SupportCategory = 'bug' | 'question' | 'billing' | 'feature_request' | 'other'

export interface CreateSupportRequestInput {
  workspaceId: string
  userId: string
  userEmail: string
  userName: string
  category: SupportCategory
  subject: string
  message: string
}

export async function createSupportRequest(input: CreateSupportRequestInput): Promise<string> {
  const db = getDb()
  const ref = doc(collection(db, 'support_requests'))

  await setDoc(ref, {
    workspace_id: input.workspaceId,
    user_id: input.userId,
    user_email: input.userEmail,
    user_name: input.userName,
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'open',
    created_at: serverTimestamp(),
  })

  return ref.id
}
