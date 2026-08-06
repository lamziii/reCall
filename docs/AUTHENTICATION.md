# Authentication

How Recall authenticates users, branches by provider, and where security features stand. Source of
truth for the auth layer; see [ONBOARDING_ARCHITECTURE.md](ONBOARDING_ARCHITECTURE.md) for how this
plugs into onboarding and [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md) for the data.

## Providers

Recall uses **Firebase Authentication** with two providers, both wired through one service
(`frontend/src/lib/auth/auth-service.ts`) — there is no second auth system:

- **Google** — `signInWithGoogle()` (popup, with automatic full-page-redirect fallback when popups
  are blocked). Google accounts arrive with a verified email, name, and avatar.
- **Email / password** — `signUpWithPassword()` / `signInWithPassword()`.

`subscribeToAuth()` force-refreshes the ID token on each auth-state change so a deleted/disabled
account can't ride a stale cached session into the app.

## Where each flow lives

| Surface | Purpose |
|---|---|
| `/login` | Sign-in for **returning** users (Google + email/password). No sign-up form. |
| `/onboarding` (step 1) | Account **creation** for new users (email/password or Google), then setup. |

Both call the same auth-service functions. Splitting them keeps a single sign-up path (onboarding)
without duplicating auth UI.

### Provider branching in onboarding

- **Email/password users** enter name, email, password, confirm password, and must accept the Terms
  before the account is created (`validateAccountStep`). The account is created **before** step 2.
- **Google users** authenticate via the Google popup; we prefill name/email/avatar and **never** ask
  for a password. Step 1 then shows an identity-confirmation card.
- **Already-authenticated users** who haven't finished onboarding are routed to resume it; completed
  users go straight to `/app`.

## Route guards (`frontend/src/lib/auth/require-auth.tsx`)

- `RequireAuth` — `/app` requires a signed-in user, else → `/login`.
- `RequireOnboarded` — `/app` additionally requires `users/{uid}.onboarding_completed === true`, else
  → `/onboarding`.
- `RedirectIfAuthed` — `/login` sends a signed-in user to `/app` (or `/onboarding` if unfinished).

No redirect loop: `/app` → `/onboarding` only when onboarding is incomplete; `/onboarding` → `/app`
only when it is complete. Demo mode (`VITE_RECALL_DEMO=true`) bypasses the onboarding gate.

## Error handling

Raw Firebase error codes are never shown. `authErrorMessage()` maps them to human text
(email-already-in-use, invalid-email, weak-password, wrong-password/invalid-credential,
user-not-found, network-request-failed). Popup-cancelled is treated as a silent no-op; popup-blocked
falls back to redirect sign-in.

## Passwords & security invariants

- Passwords and confirm-password values are **never** persisted to Firestore — they go only to
  Firebase Auth. The onboarding form holds them transiently in memory.
- No custom hashing, no custom OTP. Firebase Auth only.
- Workspace access and invitations are enforced in `firestore.rules`, not just the client.

## Email verification

The onboarding "Secure your account" step lets email/password users send a Firebase verification
email (`sendVerificationEmail()`), then confirm it (`refreshEmailVerified()`). Google accounts are
already verified. This is fully functional with no extra configuration.

## Two-factor authentication (2FA) — status: **pending Firebase configuration**

The onboarding security step offers real **TOTP (authenticator-app) 2FA** via Firebase's multi-factor
API (`startTotpEnrollment()` → `finalizeTotpEnrollment()`), and stores the outcome on the profile as
`two_factor_status`: `"enabled" | "skipped" | "unavailable"`.

TOTP enrollment requires **Google Cloud Identity Platform** with multi-factor auth enabled — a
Firebase Console / GCP change that cannot be made from this repository. Until an administrator enables
it:

- Clicking **Set up authenticator app** attempts real enrollment. If the project isn't configured,
  Firebase rejects it and the UI honestly records `two_factor_status: "unavailable"` ("Pending
  setup") — **it never shows a false "enabled" state.**
- Users can **Skip for now** (`"skipped"`), and re-enable later from Settings → Security.
- If Identity Platform **is** enabled, the same flow completes real enrollment end-to-end and stores
  `"enabled"`.

### To enable real 2FA (admin, one-time)

1. Firebase Console → **Authentication → Sign-in method → Advanced → Multi-factor authentication**,
   or upgrade the project to **Identity Platform** and enable **TOTP** as a second factor.
2. Add your app domains to the authorized domains list.
3. No app code change is required — `startTotpEnrollment()` will then succeed and the UI will drive
   real enrollment.

## Invitation email delivery — status: **not configured (persisted only)**

Invitations are created in `workspace_invites` and secured by rules, but Recall has **no
transactional email provider** wired up. The client says **"Invitation created"** — never "email
sent". A Cloud Function seam exists at `firebase/functions/src/invites.ts` (`onInviteCreated`) that
currently only logs; wire a provider (SendGrid / Resend / Postmark) there to send an accept link.
Keep the provider key in Secret Manager / functions env — never in the client. See
[ONBOARDING_ARCHITECTURE.md](ONBOARDING_ARCHITECTURE.md#invitations).
