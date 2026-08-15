# Recall — Architecture

> The system as it stands after the Vite → Next.js migration (2026-08-14). The Next.js app in `web/`
> is the sole Recall web application; the original Vite app (`frontend/`) has been removed. Companion
> docs: `NEXTJS_MIGRATION.md` (how we got here), `BACKEND_BOUNDARIES.md` (Functions),
> `ENVIRONMENT.md` (config), `PROJECT_RECAP.md` (product state).

## 1. Application structure

```
web/
  src/
    app/            App Router (routes, layouts) + colocated shell/ and theme/ (non-route)
    views/          page implementations (the Vite "pages", renamed — src/pages is reserved by Next)
    components/     shared UI library (~150 components, design tokens)
    data/           per-feature data layer (live Firestore hooks + sample layer)
    settings/       preferences engine (schema, sanitize, migrate, runtime CSS vars, cloud sync)
    lib/            firebase/ (client), router-compat, env, theme, ai, utils
    server/         firebase/admin.ts (trusted server seam) — future domain layer
    styles/         Tailwind v4 tokens + animation CSS
firebase/           Firestore rules/indexes, Storage rules, Cloud Functions (backend)
```

## 2. App Router structure

Route groups: `(marketing)` (`/`, `/plans`), `(auth)` (`/login`), `onboarding`, `app/*` (the product),
`dev/*` and `tasks` (internal). Dynamic segments: `app/sessions/[id]`, `projects/[id]`, `people/[id]`,
`teams/[id]`, `settings/[section]`. The `/app` layout is the authenticated shell
(`RequireAuth → RequireOnboarded → WorkspaceProvider → RecallShell`); nested route content reaches the
shell's `<Outlet/>` via an `OutletProvider` bridge (`lib/router-compat`). URLs are unchanged from Vite.

## 3. Server vs Client Component policy

The Vite app was a pure client SPA. To preserve behavior exactly and avoid SSR-time browser/Firebase
access across ~500 files, page **content** renders client-only: the root layout wraps `{children}` in
`<ClientOnly>` (mounts after hydration). The server still renders `<html>/<head>` — metadata, the
no-flash theme script, and global CSS. Providers and the `/app` shell are Client Components (realtime,
command palette, recording, framer-motion). Marketing/auth/onboarding layouts are Server Components
that pin `data-theme="dark"`. **Re-enabling SSR per route (e.g. marketing SEO) is a deliberate future
step**, done route-by-route — the client-only default is a migration decision, not a permanent ceiling.

## 4. Firebase Web SDK (browser)

`lib/firebase/client.ts` is the browser entry (re-exports `getFirebaseApp/Auth/Db/Storage`). Config
comes from `lib/env.ts` (`NEXT_PUBLIC_FIREBASE_*`, public by design — Rules enforce access). Used for
Auth, Firestore reads/writes, realtime `onSnapshot`, Storage uploads, and calling Cloud Functions by
URL with the user's ID token.

## 5. Firebase Admin (trusted server)

`server/firebase/admin.ts` imports `server-only` (compile-time guard against client import). It is a
**seam for a future server/domain layer and is unused today** — all privileged work still runs in
Cloud Functions. Credentials would come from a server-only env var, never `NEXT_PUBLIC_*`.

## 6. Cloud Functions

Seven HTTPS/trigger functions remain Firebase-hosted (unchanged by this migration). Firestore triggers
(`onWorkspaceCreated`, `updated_at` stampers, `onInviteCreated`) stay permanently. HTTPS functions
(`transcribeSession` — 1-hour long-running, `extractSessionReview`, `transcribeVoice`,
`recallAiChat` SSE, `benchmarkTranscription`) stay for now; some are later Route-Handler candidates.
Full classification + rationale: `BACKEND_BOUNDARIES.md`.

## 7. Firestore collections

`workspaces/{id}` (+ `members/` subcollection; plan, `ai_usage`, bonus counters, trial anchor),
`sessions/{id}`, `session_reviews/{sessionId}` (1:1 with session), `tasks/{id}`, `projects/{id}`,
`notifications/{id}`, `documents/{id}`, `workspace_invites/{id}`, `users/{uid}` (profile + onboarding +
`preferences`), `development_tasks/{id}` (internal). Schema unchanged by the migration. Source of
truth: `firebase/FIREBASE_SCHEMA.md`.

## 8. Storage

Session audio uploaded (best-effort, non-blocking) to Cloud Storage; long recordings are read
out-of-band by `transcribeSession` (avoids the ~32MB inline request cap). Storage Rules unchanged.

## 9. Authentication

Firebase Auth, **client-side** (preserved from Vite): `AuthProvider` subscribes to
`onAuthStateChanged`; guards (`RequireAuth`, `RequireOnboarded`, `RedirectIfAuthed`) render redirects
via `router-compat`. Google (popup→redirect fallback) + email/password. No server sessions/cookies yet
— a server-native Firebase session is a possible later step, evaluated after parity. Workspace
membership is enforced **server-side in every privileged Function**, independent of the client.

## 10. AI pipeline (session review)

record/paste → `transcribeSession` (OpenAI diarize, chunked) → Claude correction pass →
`extractSessionReview` (Claude Structured Outputs → `session_reviews/{id}`) → `sessionArtifacts`
canonicalizes candidate tasks into real `tasks/{id}` (deterministic ids, idempotent) → realtime UI.
All server-side; keys never reach the browser.

## 11. Recall AI (assistant)

`recallAiChat` (SSE): verifies ID token + workspace membership, retrieves a **bounded, workspace-scoped**
context package, builds an injection-hardened system prompt (workspace content is untrusted data inside
a delimited block), streams Claude. Usage metered on `workspaces/{id}.ai_usage[YYYY-MM]`; caps per plan;
bonus questions. Client: `lib/ai/recall-ai-client.ts` streams over SSE with only the ID token.

## 12. Realtime data

Live features subscribe via Firestore `onSnapshot` (`data/live/live-store.ts` + feature hooks) — Home,
Sessions, Session Review, Tasks, Calendar, Usage, Recall AI usage. Preserved as-is; these are the
reason the `/app` shell is a Client Component.

## 13. Domain layer

Intended: `src/server/{auth,workspaces,sessions,reviews,tasks,projects,ai,transcription,notifications,
billing}/` exposing APIs (`getSession`, `listTasks`, …) so UI depends on application logic, not raw
Firestore. **Today the seam exists (`server/firebase/admin.ts`) but is not populated** — data still
flows through the client Firebase modules, unchanged. This is deliberate: build seams when they deliver
portability, not a speculative repository rewrite during a framework migration.

## 14. Production vs demo data

One switch, `getDataMode()` (`data/live/data-mode.ts`), gated by `NEXT_PUBLIC_RECALL_DEMO`. Production =
`live` (real Firestore only); demo = localStorage sample layer (dev/test only). No silent live→demo
fallback. Details: `ENVIRONMENT.md` §3.

## 15. Eventual custom-backend migration seam

Firestore is **not** intended to be permanent. The portability seams: (a) `NEXT_PUBLIC_FIREBASE_*_URL`
overrides decouple the client from Function hosting; (b) `server/firebase/admin.ts` + the planned
`server/<domain>/` APIs mean a datastore swap touches the domain layer, not every component; (c)
Firestore triggers become the new datastore's change-stream handlers; (d) the AI/transcription pipeline
is already isolated behind HTTP endpoints. The realistic path: introduce `server/<domain>` read APIs,
move UI reads onto them incrementally, then repoint those APIs at the new backend.

## 16. Status / caveat

Production build passes; typecheck clean; public routes + auth guards verified in a real browser
(production mode). **The authenticated runtime (realtime data, recording, SSE) has not been exercised
end-to-end** — that requires a real sign-in. Until it is, `frontend/` (Vite) stays as the fallback and
the cutover is **not** final. See the cutover completion report and `NEXTJS_MIGRATION.md`.
