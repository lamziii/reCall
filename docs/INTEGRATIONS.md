# Integrations (Slack, Notion, and beyond)

> **Status: not built yet.** This is an architecture/strategy doc, written before any code exists,
> so implementation can start from an agreed design instead of ad-hoc choices. Confirmed by a full
> repo audit: there is no OAuth, webhook, or per-workspace external-credential code anywhere today.
> The only external API keys in the codebase (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
> `SPEECHMATICS_API_KEY`) are app-wide Cloud Functions secrets, never scoped to a workspace.

## What "integrating Slack/Notion" means here

One direction, one payload: pushing a **Session Review** (summary, decisions, candidate/promoted
tasks) out to a Slack channel or a Notion page. Not two-way sync, not importing from Slack/Notion
into Recall, not a general webhook platform — that's a reasonable v2+ direction but out of scope
for the design below.

## Connection model — two stages

Real OAuth ("Connect with Slack" button, no copy-pasting) is the nicer end state, but it has a
hard external dependency: **someone has to register a Slack App and a Notion public integration**
in their respective developer consoles and hand over a client ID + client secret before a single
line of OAuth code can be tested against something real. That's an account-creation step only a
human with access to those consoles can do — not something to fabricate placeholder credentials
for.

So the design ships in two stages:

### v1 — credential paste (buildable now, no external dependency)

The workspace owner does a ~30-second setup step in the provider's own UI and pastes the result
into Recall:

- **Slack**: create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) for one
  channel (Slack workspace admin → Apps → "Incoming Webhooks" → Add to a channel). No app review.
  Copy the `https://hooks.slack.com/services/...` URL.
- **Notion**: create an [Internal Integration](https://www.notion.so/my-integrations), copy its
  `secret_...` token, then in Notion share the target page/database with that integration. Copy
  the database's id from its URL.

Both are real, working credentials the moment they're pasted in — no waiting on anyone.

### v2 — OAuth upgrade (later, blocked on the user)

Swap the paste-a-credential flow for a "Connect with Slack" / "Connect with Notion" button that
does a real OAuth redirect. Needs, before any code changes:

1. A Slack App (scopes: `chat:write`, `channels:read`) with its OAuth redirect URI pointed at a
   new Cloud Function.
2. A Notion **public** integration with its redirect URI pointed at a Cloud Function.
3. Both apps' client ID + client secret, handed over to be stored as Cloud Functions env secrets
   (never in the frontend, never in Firestore, never in git — same rule as every existing server
   key in `firebase/functions/.env`).

Until that happens, v1's pasted credentials are the real, honest mechanism — same posture this
codebase already takes with invite emails (see below): don't claim a capability that isn't wired.

## Provider abstraction

Modeled directly on the existing pluggable transcription-provider layer at
`firebase/functions/src/transcription/` (`provider.ts` interface + `registry.ts` map + one file
per provider under `providers/`) — the same shape, applied to a different kind of provider:

```ts
// firebase/functions/src/integrations/provider.ts
export type IntegrationProviderName = 'slack' | 'notion'

export interface SessionReviewPayload {
  sessionTitle: string
  summary: string
  decisions: string[]
  tasks: string[]
  sessionUrl: string // deep link back into Recall
}

export interface IntegrationProvider {
  name: IntegrationProviderName
  /** Format/connectivity check right after the user pastes a credential — also returns a
   *  human label to show in Settings (e.g. the Slack channel or Notion database title). */
  validateCredential(credential: unknown): Promise<{ ok: boolean; label?: string; error?: string }>
  sendSessionReview(credential: unknown, payload: SessionReviewPayload): Promise<{ ok: boolean; error?: string }>
}
```

```ts
// firebase/functions/src/integrations/registry.ts
export const PROVIDERS: Record<IntegrationProviderName, IntegrationProvider> = {
  slack: slackProvider,
  notion: notionProvider,
}
export function isProviderName(name: string): name is IntegrationProviderName { ... }
export function getProvider(name: IntegrationProviderName): IntegrationProvider { return PROVIDERS[name] }
```

Adding Linear, Jira, or Google Drive later is "one new file under `providers/` + one line in
`PROVIDERS`" — exactly how the transcription registry already scales from OpenAI to Speechmatics.

**Provider-specific credential shapes** (stored as small JSON objects, not bare strings):
- Slack: `{ webhook_url: string }`
- Notion: `{ token: string; database_id: string }`

**Notion scope cut, called out explicitly**: v1 creates a page with a title + body blocks
(paragraphs/headings), not mapped database properties. An arbitrary user's database has an
unpredictable property schema (custom property names, required selects, etc.); relying on a
specific property name being present would be fragile and break silently for many databases.
Structured property mapping is a reasonable v2+ enhancement once the target audience's databases
are better known.

## Data model

Two collections, split by trust level — this is a **new pattern for this repo** (no existing
collection is fully client-locked-out; introducing one here is deliberate).

### `workspaces/{workspaceId}/integrations/{provider}` — status (client-readable)

A subcollection under `workspaces/{workspaceId}`, mirroring the existing `members` subcollection
there. Written only by Cloud Functions; workspace members can read it so Settings can render
connection state without a round trip through a function.

```json
{
  "connected": true,
  "connected_by": "auth-uid",
  "connected_at": "2026-08-11T00:00:00Z",
  "label": "#team-standups"
}
```

Firestore rule:
```
match /workspaces/{workspaceId}/integrations/{provider} {
  allow read: if isWorkspaceMember(workspaceId);
  allow write: if false; // Cloud Functions only, via the Admin SDK
}
```

### `workspace_integration_secrets/{workspaceId}__{provider}` — the credential (never client-readable)

Top-level collection, deterministic id (`${workspaceId}__${provider}`, same idiom as
`inviteIdFor()` in `frontend/src/data/live/invites.ts`). Holds the raw credential object described
above. **No client, ever, reads this back — not even the owner who pasted it in** — the same way a
GitHub personal access token is shown once and never again.

Firestore rule:
```
match /workspace_integration_secrets/{docId} {
  allow read, write: if false;
}
```

The Admin SDK (`firebase/functions/src/admin.ts`'s `db`) bypasses security rules by default, so
this collection is reachable exclusively through the two Cloud Functions below — never directly by
any client SDK.

## Cloud Functions

This repo uses `onRequest` + manual Bearer-token verification exclusively — `onCall` is never
used anywhere (confirmed via audit). New functions follow the same shape as
`extractSessionReview.ts`: read `Authorization: Bearer <idToken>`, verify with
`getAuth().verifyIdToken()`, handle CORS manually, respond with a `{ result }` / `{ error }` JSON
envelope.

- **`manageIntegrationConnection`** — `{ action: 'connect' | 'disconnect', workspaceId, provider, credential? }`.
  On connect: verifies the caller is a workspace member, calls
  `getProvider(provider).validateCredential(credential)`, and on success writes the secret doc and
  the status doc in one batch. On disconnect: deletes both.
- **`sendToIntegration`** — `{ workspaceId, provider, sessionId }`. Verifies membership, loads the
  session review, loads the secret (server-side only), builds a `SessionReviewPayload`, calls
  `getProvider(provider).sendSessionReview(...)`.

Mirror the "not configured yet" honesty convention already established twice in this codebase
(`firebase/functions/src/invites.ts` and `firebase/functions/src/support.ts`, both currently
log-only "email delivery boundary" stubs): **`sendToIntegration` must never report success unless
the provider call actually succeeded** — no optimistic UI claims ahead of the real send.

## Frontend

- `frontend/src/data/live/integrations.ts` (new) — a live-subscription hook over
  `workspaces/{workspaceId}/integrations/*` for connection status (same `onSnapshot` shape as
  `use-workspace-plan.ts` / `use-workspace-bonus-minutes.ts`), plus thin wrappers that call the two
  new Cloud Functions.
- Calling convention matches `frontend/src/lib/firebase/functions.ts` exactly: `getFirebaseAuth().currentUser`
  → `user.getIdToken()` → `fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body })`.
  No Firebase callable-functions SDK is used anywhere in this repo; stay consistent. Each function
  needs its own `VITE_FIREBASE_*_URL` env var, same as `transcribeUrl` / `extractReviewUrl` today.
- **Settings → new "Integrations" tab** in `frontend/src/pages/app/settings.tsx` (currently
  Account/Plan/Payments/Notifications/Appearance — this is a 6th `Tab`/`TabPanel`). Per-provider
  card: connect form (Slack: webhook URL field; Notion: token + database URL fields) → on success
  shows connected state with the `label` and a Disconnect button. A couple of greyed "Coming soon"
  cards (Linear, Google Drive) frame the "and more" without overpromising.
- **Session Review page** (`frontend/src/pages/app/session-review-live.tsx`) — "Send to Slack" /
  "Export to Notion" buttons in the toolbar, disabled with a tooltip until that provider shows
  connected; on click, call `sendToIntegration` and toast the real result.

## Phased rollout

| Phase | Scope | Blocked on |
|---|---|---|
| 0 | Data model, Firestore rules, `integrations/` provider scaffold, empty Settings tab | — |
| 1 | Slack webhook connect + real "Send to Slack" | — |
| 2 | Notion token connect + real "Export to Notion" | — |
| 3 | OAuth upgrade for both (real "Connect" buttons) | User registers a Slack App + Notion public integration, hands over client ID/secret for each |
| 4 | More providers (Linear, Jira, Google Drive, generic outgoing webhook) via the same registry | — |

Phases 0–2 need nothing external and can be built end-to-end today. Phase 3 is explicitly gated on
the user completing the app-registration step in Slack's and Notion's own developer consoles —
that's the one piece of this plan only they can do.
