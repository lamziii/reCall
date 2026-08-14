import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Email-delivery boundary for "Contact support" submissions from the Help Center.
 *
 * When a request is created in `support_requests/{requestId}`, this trigger fires. Recall does NOT
 * have a transactional email provider wired up yet, so today this ONLY logs — it does not notify
 * anyone, and the client is careful never to claim a support agent was paged (it says the message
 * was received).
 *
 * To enable real delivery, add a provider (SendGrid / Resend / Postmark) here: read the request
 * fields and send a notification to the support inbox (and/or an ack to the requester). Keep the
 * provider API key in Secret Manager / functions env — never in the client. Mirrors
 * `onInviteCreated` in `invites.ts`. See docs/AUTHENTICATION.md → "Invitation email delivery" for
 * the equivalent, already-documented seam.
 */
export const onSupportRequestCreated = onDocumentCreated("support_requests/{requestId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data();
  if (data.status !== "open") return;

  // TODO(email-provider): replace this log with a real send once a provider is configured.
  logger.info("support request created — email delivery not configured (persisted only)", {
    requestId: event.params.requestId,
    workspace_id: data.workspace_id,
    category: data.category,
    subject: data.subject,
    // Do not log the requester's raw email/message at info level in production; id + workspace +
    // subject suffice for triage without duplicating user content into log storage.
  });
});
