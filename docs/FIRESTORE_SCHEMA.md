# Firestore Schema

The authoritative, full schema lives next to the Firebase config it documents:

## → [`../firebase/FIREBASE_SCHEMA.md`](../firebase/FIREBASE_SCHEMA.md)

This file is a pointer so the schema isn't duplicated (a second copy would drift). Read the file
above for every collection, field rule, and index.

Collections at a glance:

| Collection | Purpose | Onboarding-related |
|---|---|---|
| `users/{uid}` | Canonical per-account profile | **Yes** — onboarding status/step, preferences, use cases, 2FA status |
| `workspaces/{ws-uid}` | Workspace (deterministic id `ws-<uid>`) | **Yes** — name, type, team size, industry, `onboarding_completed` |
| `workspaces/{ws}/members/{uid}` | Membership + role | Owner enrolled at creation |
| `workspace_invites/{inviteId}` | Pending team invitations | **Yes** — created on finish; owner-only, role-constrained |
| `sessions/{id}` | Recording metadata + transcript | No |
| `session_reviews/{sessionId}` | AI review (1:1 with session) | No |
| `tasks/{id}` | Actionable task board | No |
| `projects/{id}` | Project grouping | No |
| `documents/{id}` | Uploaded-file metadata | No |
| `notifications/{id}` | Per-user notifications | No |

Related docs:
- [ONBOARDING_ARCHITECTURE.md](ONBOARDING_ARCHITECTURE.md) — how `users` / `workspaces` /
  `workspace_invites` are written and resumed.
- [AUTHENTICATION.md](AUTHENTICATION.md) — auth providers, route guards, 2FA & invite-email status.
- [CONTRACTS.md](CONTRACTS.md) — frontend/API field contracts for sessions, reviews, tasks.
