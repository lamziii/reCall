import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Email-delivery boundary for workspace invitations.
 *
 * When an invite is created in `workspace_invites/{inviteId}`, this trigger fires. Recall does NOT
 * have a transactional email provider wired up yet, so today this ONLY logs — it does not send an
 * email, and the client is careful never to claim an email was sent (it says "Invitation created").
 *
 * To enable real delivery, add a provider (SendGrid / Resend / Postmark) here: read the invite
 * fields, render an accept link (e.g. https://<app>/join?invite={inviteId}), and send. Keep the
 * provider API key in Secret Manager / functions env — never in the client. See
 * docs/AUTHENTICATION.md → "Invitation email delivery".
 */
export const onInviteCreated = onDocumentCreated("workspace_invites/{inviteId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data();
  if (data.status !== "pending") return;

  // TODO(email-provider): replace this log with a real send once a provider is configured.
  logger.info("workspace invite created — email delivery not configured (persisted only)", {
    inviteId: event.params.inviteId,
    workspace_id: data.workspace_id,
    role: data.role,
    // Do not log the invitee's raw email at info level in production; id + workspace suffice.
  });
});
