# Onboarding Architecture

How a new user goes from nothing to a real, owned workspace, and how progress is saved and resumed.
Companion docs: [AUTHENTICATION.md](AUTHENTICATION.md) (providers, guards, 2FA) and
[FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md) (collections/fields).

## The flow

```
Create account → Secure account → Use cases → Workspace → Regional → Invite team → Review → /app
     step 1          step 2          step 3      step 4      step 5      step 6      step 7
```

`onboarding_step` on the user profile is a 1-based index into `STEPS`
(`frontend/src/pages/onboarding/types.ts`). Steps 2–7 only run once the user is authenticated.

| Step | What it collects | Persists to |
|---|---|---|
| 1. Create account | Google **or** name/email/password + consent (or identity confirmation if already authed) | Firebase Auth + `users/{uid}` |
| 2. Secure account | Email verification (password users); 2FA enable/skip → `two_factor_status` | Firebase Auth + `users/{uid}` |
| 3. Use cases | Multi-select + optional "Other" text | `users/{uid}.use_cases`, `custom_use_case` |
| 4. Workspace | Name (req), type (req), team size (req), industry (opt) + custom | `workspaces/{ws}` |
| 5. Regional | Language (4 supported, native labels), auto-detected time zone, searchable country, date & time format | `users/{uid}` |
| 6. Invite team | Emails + role (admin/member), validated | `workspace_invites/*` (on finish) |
| 7. Review | Editable summary (jump back to any step) | — |

## Workspace creation — one source of truth, no duplicates

The workspace id is **deterministic**: `ws-<uid>` (`workspaceIdForUser`). Because both onboarding and
the `/app` fallback resolve to the *same* document id, a workspace can never be duplicated across
refreshes, tabs, or the two code paths.

- **Onboarding is the source of truth** for the workspace's descriptive fields (name, type, team
  size, industry) and for completion (`onboarding_completed`). It writes them progressively
  (`data/live/onboarding.ts`).
- **`ensureWorkspace(user)`** (`data/live/workspace-bootstrap.ts`) is the idempotent **fallback**: it
  creates `ws-<uid>` + the owner membership + a minimal `users/{uid}` profile **only if missing**, and
  never overwrites onboarding-provided values. It runs on `/app` entry (`WorkspaceProvider`) as
  recovery for legacy/edge users. `bootstrapWorkspace` is kept as a deprecated alias.

The user is always written as the workspace **owner** (member doc `role: 'owner'`; the client
self-enroll rule + the `onWorkspaceCreated` trigger are belt-and-suspenders).

## Save-as-you-go & resume

- After successful auth, `beginOnboarding()` ensures the workspace/profile and flags
  `onboarding_status: 'in_progress'`.
- Every **Continue** calls `saveOnboardingProgress()`, a merge-write of the mapped profile +
  workspace fields **and** the resume pointer (`onboarding_step`). A partial failure never wipes prior
  answers; a full failure surfaces an inline error and does not advance.
- On reload, the page loads `users/{uid}` + `workspaces/{ws}` and `hydrateForm()` rebuilds the form
  (saved answers > auth identity > locale-detected defaults), resuming at `onboarding_step`.
- **Finish** calls `completeOnboarding()` — sets `onboarding_status: 'completed'`,
  `onboarding_completed: true` on both the profile and workspace — then creates any invites and
  navigates to `/app`. `RequireOnboarded` then admits the user; completed users can't re-enter
  onboarding (they're redirected to `/app`).

Passwords are never part of the saved state — see [AUTHENTICATION.md](AUTHENTICATION.md).

## Regional detection

`frontend/src/pages/onboarding/regional.ts` (pure, unit-tested):

- **Language** — mapped from the browser locale to one of the **four** supported codes
  (`sq`, `en`, `de`, `fr`); never a fifth. A stable code + native label are stored
  (`{ preferred_language: "sq", language_label: "Shqip" }`).
- **Time zone** — auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`, shown as a
  confirmation row with a subtle **Change** (searchable IANA list) only when needed.
- **Country** — a searchable selector over the **complete** ISO 3166 list
  (`countries.ts`), defaulted (never assumed) from the locale; stored as an ISO code.
- **Date / time format** — suggested from locale (US → `MM/DD/YYYY` + 12h; else `DD/MM/YYYY` + 24h),
  shown with a live example, fully overridable.

## Invitations

- Held in the form as `{ email, role }[]`; validated live (`validateInviteEmail`) for format, self,
  duplicates (and, where available, existing members / pending invites).
- Written on finish to `workspace_invites/{inviteId}` with a **deterministic id**
  (`inviteIdFor(workspaceId, email)`) so re-inviting the same address is idempotent (no duplicates).
- **Security** (enforced in `firestore.rules`): only the workspace **owner** may create an invite;
  role is constrained to `admin | member` (never `owner`, so a client can't self-escalate); the
  inviter is pinned to the caller; reads are limited to workspace members or the invited email;
  `workspace_id`/`role` are immutable on update.
- **Email delivery is not configured.** Invites are persisted only; the UI says "Invitation created",
  never "sent". `firebase/functions/src/invites.ts` (`onInviteCreated`) is the future-compatible
  send seam. Acceptance UI (a `/join?invite=…` page) is not built yet — the model and rules are ready
  for it. See [AUTHENTICATION.md](AUTHENTICATION.md#invitation-email-delivery--status-not-configured-persisted-only).

## Key files

```
frontend/src/pages/onboarding/
  index.tsx            orchestrator (auth resolve, resume, persist, routing)
  types.ts             form model, STEPS, mappers, hydrateForm
  options.ts           use cases, workspace types, team sizes, industries, languages, formats, roles
  countries.ts         complete ISO 3166 list + helpers
  regional.ts          locale/timezone detection + format examples
  validation.ts        account + invite validation (pure)
  steps/*.tsx          create-account, secure-account, use-case, workspace, regional, invite, review
frontend/src/data/live/
  onboarding.ts        profile/workspace writers (beginOnboarding, saveOnboardingProgress, complete)
  workspace-bootstrap.ts  ensureWorkspace (idempotent fallback) + workspaceIdForUser
  invites.ts           createInvite(s), getPendingInviteEmails, revokeInvite
  use-user-profile.ts  live users/{uid} subscription (gates routing)
firebase/
  firestore.rules      users, workspaces, workspace_invites rules
  firestore.indexes.json  workspace_invites indexes
  functions/src/invites.ts  onInviteCreated (email-delivery seam)
```
