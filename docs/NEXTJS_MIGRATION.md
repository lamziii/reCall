# Recall — Next.js (App Router) Migration

> **Status: COMPLETE.** The Next.js app in `web/` reached parity and is now the sole Recall web
> application; the original Vite app (`frontend/`) has been removed from the repository. This was a
> *production-preservation* migration, not a rewrite. The sections below are kept as the historical
> record of how the migration was carried out. Originally written 2026-08-13.

---

## 0. Migration strategy (the one decision everything else follows)

**The Next.js app lives in a new top-level `web/` directory with its own `package.json`.** The
existing `frontend/` (Vite) is left completely untouched.

Why parallel, not in-place:
- The brief requires keeping the Vite app working as a reference until parity — impossible if we
  transform `frontend/` in place (Next and Vite have incompatible entrypoints, configs, env models,
  and router).
- It makes rollback trivial: delete `web/`, nothing else changed.
- Both apps talk to the **same Firebase project, same Firestore schema, same Cloud Functions**, so
  running them side by side is safe.

Code moves by **copy-and-adapt** into `web/src`, not by cross-importing from `../frontend/src`
(cross-import would drag `react-router-dom` and Vite-only `import.meta.env` into the Next build).
Duplication is the intended, temporary cost of a safe migration; the `frontend/` copy is deleted at
the end, per-area, only after that area hits parity.

Eventual end state: `web/` is promoted to the app root (or renamed `frontend/`) and the old Vite
tree is removed. Not this phase.

---

## 1. Current architecture (Vite app, `frontend/`)

- **Entry:** `index.html` → `src/main.tsx` → `createRoot(#root).render(<App/>)`.
- **`index.html` runs a blocking inline script** before first paint that reads `localStorage`
  (`recall-theme`, `recall-preferences`) and stamps `data-theme` / `data-accent` / `data-radius` /
  `data-font` / `data-reduce-motion` / … on `<html>` to prevent a theme/appearance flash. **This must
  be replicated in the Next root layout.**
- **`App.tsx` provider stack (outermost → innermost):**
  `ThemeProvider` → `BrowserRouter` → `AuthProvider` → `RecallPreferencesProvider` →
  `ToastProvider` → `AppRoutes`.
- **Routing:** `react-router-dom` v7, `<BrowserRouter>` + `<Routes>` in `src/routes/index.tsx`.
  All routing is **client-side**. **61 files import `react-router-dom`.**
- **Auth:** 100% client-side Firebase Web SDK. `AuthProvider` subscribes to `onAuthStateChanged`;
  route guards (`RequireAuth`, `RequireOnboarded`, `RedirectIfAuthed`) render `<Navigate>` redirects.
  No server sessions, no cookies.
- **Data layer:** per-feature hooks in `src/data/**`. Live features use Firestore `onSnapshot`
  realtime listeners (`data/live/live-store.ts`). Un-wired features read a localStorage sample layer
  (`data/workspace-repository.ts`). A `DataMode` (`live` | `demo`) switch gates the two.
- **Styling:** Tailwind CSS v4 (CSS-first, **no `tailwind.config`**) via `@tailwindcss/vite`. Single
  CSS entry `src/styles/tokens/index.css` `@import`s `tailwindcss`, `@fontsource-variable/inter`, and
  the token/animation CSS files. Semantic color tokens key off `<html data-theme>`.
- **Env:** all vars are `VITE_*`, read via `import.meta.env` (`lib/firebase/config.ts`). Also
  `import.meta.env.DEV` (6 files) and `import.meta.env.VITE` (1 file, `lib/diagnostics.ts`).
- **Build/lint/test:** `tsc -b && vite build`; lint = **oxlint**; tests = **Vitest** + Testing
  Library (jsdom), `src/test/setup.ts`.
- **Toolchain:** React 19.2, TypeScript ~6.0, Vite 8, Firebase 12.17, framer-motion 12, lucide 1.26,
  cva 0.7. No `React.lazy` (no manual route code-splitting).

---

## 2. Target architecture (Next.js app, `web/`)

- **Next.js 16 (App Router) + React 19 + TypeScript.** Turbopack default.
- **Server Components by default; Client Components at the lowest practical boundary.** In practice
  the entire `/app` shell is a client boundary (realtime listeners, MediaRecorder, framer-motion,
  command palette) — that is correct and intentional, not a smell.
- **Tailwind v4 via `@tailwindcss/postcss`** (`postcss.config.mjs`). The token CSS is **copied
  verbatim** from the Vite app (it has no bundler-specific syntax) and imported in the root layout.
- **Env:** `NEXT_PUBLIC_FIREBASE_*` for browser config; unprefixed server-only vars
  (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, …) never exposed to the client.
  A small `src/lib/env.ts` shim replaces `import.meta.env`.
- **Firebase split made explicit:**
  - `src/lib/firebase/client.ts` — Web SDK (Auth, Firestore, Storage, realtime). Client only.
  - `src/server/firebase/admin.ts` — `firebase-admin`, privileged access. Server only. **Never**
    imported by a client component.
- **Domain/server layer** (`src/server/**`) prepared as the seam for a future custom backend — empty
  scaffolding this phase, not populated.

### Target folder layout (aspirational; built incrementally)

```
web/src/
  app/
    layout.tsx                 root: global CSS, no-flash script, <Providers>
    providers.tsx              "use client" provider stack
    (marketing)/               / , /plans      (forced dark, public)
    (auth)/login/              /login
    onboarding/                /onboarding
    app/
      layout.tsx               "use client" auth-gated shell (sidebar/topbar)
      page.tsx                 /app  (LandingGate)
      assistant/ sessions/ sessions/[id]/ record/ projects/ tasks/
      calendar/ usage/ people/ people/[id]/ teams/ teams/[id]/
      reviews/ notifications/ settings/[section]/
    dev/design/  dev/transcription-benchmark/
    tasks/                     internal dev board
    api/                       (reserved; not used this phase)
  components/ features/ hooks/ lib/ lib/firebase/ server/ settings/ types/ styles/
```

---

## 3. Route mapping (react-router → App Router)

| Current (react-router) | App Router file | Group / notes |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | `(marketing)` group, forced dark |
| `/plans` | `app/(marketing)/plans/page.tsx` | forced dark |
| `/login` | `app/(auth)/login/page.tsx` | `RedirectIfAuthed` → client guard |
| `/onboarding` | `app/onboarding/page.tsx` | forced dark, resumable funnel |
| `/dev/design` | `app/dev/design/page.tsx` | internal |
| `/dev/transcription-benchmark` | `app/dev/transcription-benchmark/page.tsx` | auth-gated |
| `/tasks` | `app/tasks/page.tsx` | internal dev board, auth-gated |
| `/app` (index, `LandingGate`) | `app/app/page.tsx` | inside `app/app/layout.tsx` shell |
| `/app/assistant` | `app/app/assistant/page.tsx` | |
| `/app/sessions` | `app/app/sessions/page.tsx` | |
| `/app/sessions/:id` | `app/app/sessions/[id]/page.tsx` | dynamic segment |
| `/app/record` | `app/app/record/page.tsx` | |
| `/app/projects` · `/:id` | `app/app/projects/page.tsx` · `projects/[id]/page.tsx` | sample-backed (unchanged) |
| `/app/tasks` | `app/app/tasks/page.tsx` | |
| `/app/calendar` | `app/app/calendar/page.tsx` | |
| `/app/usage` | `app/app/usage/page.tsx` | |
| `/app/people` · `/:id` | `app/app/people/page.tsx` · `people/[id]/page.tsx` | sample-backed (unchanged) |
| `/app/teams` · `/:id` | `app/app/teams/page.tsx` · `teams/[id]/page.tsx` | sample-backed (unchanged) |
| `/app/reviews` | `app/app/reviews/page.tsx` | sample-backed (unchanged) |
| `/app/notifications` | `app/app/notifications/page.tsx` | sample-backed (unchanged) |
| `/app/settings/:section` | `app/app/settings/[section]/page.tsx` | shell = `settings/layout.tsx` |

**Router API replacements** (usage counts across `frontend/src`):
`useNavigate`(90)→`useRouter().push/replace` (`next/navigation`); `Link`(41)→`next/link`;
`NavLink`(18)→`Link` + `usePathname()` for active state; `useLocation`(17)→`usePathname()`/
`useSearchParams()`; `Routes`/`Route`(57)→file-system routes; `useParams`(13)→`useParams()` from
`next/navigation` (or page `params` prop in Server Components); `Outlet`(11)→layout `{children}`;
`Navigate`(10)→`redirect()` (server) / `router.replace()` (client); `useSearchParams`(2)→
`next/navigation`. **This is the single largest mechanical surface of the migration (61 files).**

---

## 4. Provider mapping

`App.tsx` stack → one `src/app/providers.tsx` (`"use client"`) mounted in the root layout. Ordering
preserved: Theme → Auth → Preferences → Toast. `BrowserRouter` is **dropped** (App Router replaces
it). All four providers are router-free and portable as-is once copied:

| Provider | Router dep? | Notes for port |
|---|---|---|
| `ThemeProvider` | no | Guards `typeof window`. Ported first (drives no-flash + tokens). |
| `AuthProvider` | no | `onAuthStateChanged` subscription; pulls `auth-service`→`firebase/*` chain (client). |
| `RecallPreferencesProvider` | no | localStorage + cloud sync (`users/{uid}.preferences`). |
| `ToastProvider` | no | UI only. |

The **no-flash inline script** from `index.html` moves into the root `layout.tsx` `<head>` as a
`<script dangerouslySetInnerHTML>` (must run before hydration). The `/app` shell (`recall-shell.tsx`,
sidebar/topbar, command palette, AI panel, tutorial) becomes the `app/app/layout.tsx` client
boundary.

---

## 5. Browser-only modules (must be Client Components / SSR-guarded)

Counts across `frontend/src`: `window.`(42 files), `localStorage`(32), `onSnapshot`(6),
`MediaRecorder`(3), Web Speech (`SpeechRecognition`/`webkitSpeech`)(6), `framer-motion`(30).

Hard client-only surfaces:
- **Recording:** `MediaRecorder`, `AnalyserNode`, Web Speech (`data/recording/*`, `record-live.tsx`).
- **Realtime data:** every `onSnapshot` hook (`data/live/live-store.ts` + feature hooks).
- **Theme/preferences runtime:** `localStorage` reads, `matchMedia`, `data-*` attribute writes.
- **Command palette / AI panel / tutorial / reminders** (`recall-shell.tsx` subtree).
- **Voice input** (`lib/ai/use-voice-input.ts`) — `MediaRecorder` + `import.meta.env`.
- **Animations:** framer-motion components (30 files) — client.

Policy: mark these `"use client"` at the component that owns the browser API; keep marketing/static
pages as Server Components where practical. **Do not** put `"use client"` in the root layout.

---

## 6. Firebase client dependencies (stay in the browser)

`src/lib/firebase/*` (to be copied → `web/src/lib/firebase/`):
`app.ts` (singleton init), `config.ts` (**rewrite `import.meta.env`→`env.ts`**), `auth.ts`,
`firestore.ts`, `storage.ts`, `functions.ts` (HTTP client for Cloud Functions, attaches ID token),
`emulators.ts`, `benchmark.ts`. All client-safe (public config, security enforced by Rules).

## 7. Firebase server dependencies (trusted, server-only)

Currently these live **only** inside `firebase/functions/`. The Next app introduces a placeholder
`src/server/firebase/admin.ts` (firebase-admin) for **future** server logic — **not used this phase**
because we are not moving any Function into Next yet. Secrets (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
Speechmatics, service account) remain server-only and must never become `NEXT_PUBLIC_*`.

---

## 8. Cloud Functions that MUST remain unchanged initially

All of them, this phase. Explicitly keep as Firebase-hosted:

- **Firestore triggers (event-driven — no HTTP equivalent that makes sense in Next):**
  `onWorkspaceCreated`, `onWorkspaceUpdated`, `onSessionUpdated`, `onSessionReviewUpdated`,
  `onProjectUpdated`, `onTaskUpdated` (`triggers.ts`), `onInviteCreated` (`invites.ts`).
- **AI / transcription pipeline (preserve first, do not touch):** `extractSessionReview`,
  `transcribeSession` (+ `correctTranscript`, `sessionArtifacts`, `transcription/**`),
  `transcribeVoice`, `recallAiChat` (SSE), `benchmarkTranscription`.

The Next client keeps calling these at their existing HTTPS URLs via the copied `functions.ts`, with
the Firebase ID token — identical contract, no server change.

## 9. Cloud Functions that COULD later become Next.js Route Handlers

Only the request/response HTTPS ones, and only in a **later** phase, if desired:
`recallAiChat` (SSE → Next Route Handler streaming), `transcribeVoice`, `extractSessionReview`,
`transcribeSession`, `benchmarkTranscription`. Firestore triggers **cannot** move (they're
event-driven and must stay in Firebase). **No function is migrated in this phase.**

---

## 10. Migration risks

1. **61 files import react-router-dom** — the dominant mechanical cost; every navigation call and
   guard changes. Highest-volume risk.
2. **`import.meta.env` → Next env** — breaks 6 files if not shimmed; env var names change
   (`VITE_*` → `NEXT_PUBLIC_*`). Must update `.env` and every reader.
3. **No-flash theme script** — if not replicated exactly in the root layout, users get a
   theme/appearance flash on load. Parity-visible.
4. **Hydration mismatches** — theme/preferences read from `localStorage` differ between server render
   and client; must render neutral on server and reconcile in an effect, or the whole subtree stays
   client. (Vite has no SSR, so this is a *new* class of bug.)
5. **`"use client"` creep** — temptation to mark the root client to silence errors; forbidden.
6. **Tailwind v4 pipeline** — moving from `@tailwindcss/vite` to `@tailwindcss/postcss`; token CSS
   ordering and `@import 'tailwindcss'` must resolve identically.
7. **Auth timing** — client-only guards render redirects after an async auth resolve; under App
   Router this must not cause redirect loops or flashes of protected content.
8. **Code duplication drift** — while both apps exist, a fix in `frontend/` won't reach `web/`. Keep
   the migration window short per feature.
9. **Tests** — Vitest config is Vite-specific; the Next app needs its own test setup (deferred).

---

## 11. Migration checkpoints

- **C0 — Foundation builds (this phase):** `web/` installs, `next build` passes, root layout +
  global styles + no-flash script + provider scaffold + full route skeleton (placeholders) +
  Firebase client/server split + env shim. Public routes resolve.
- **C1 — Public parity:** `/`, `/plans`, `/login`, `/onboarding` ported with visual + behavioral
  parity (real Firebase auth on `/login`, resumable onboarding).
- **C2 — App shell + auth:** `/app` layout (sidebar/topbar/command palette), client auth guards,
  onboarding redirect, protected routes verified.
- **C3 — Live product parity:** Home, Recall AI (SSE), Sessions, Session Review, Record (the full
  record→review→tasks slice), Tasks, Calendar, Usage, Settings — all realtime paths verified.
- **C4 — Remaining pages** (Projects/Reviews/Notifications/People/Teams) ported **as-is** (still
  sample-backed — no silent repair), dev routes, then **delete `frontend/`**.

## 12. Rollback strategy

- Anytime before C4: `web/` is additive and isolated — **delete `web/`** and the repo is exactly as
  before. `frontend/` is never modified, so there is nothing to revert there.
- Firebase is shared and unchanged (no schema, rules, or Function edits), so no backend rollback is
  ever needed for this migration.
- Deploy safety: keep deploying the Vite app until C3 is verified in a preview deployment of `web/`.
  Cut over DNS/hosting to `web/` only after parity sign-off; keep the Vite build one revert away.

---

## Appendix — env var mapping

| Vite (`frontend/`) | Next (`web/`) | Exposure |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` | public (safe; Rules enforce) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | public |
| `VITE_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | public |
| `VITE_FIREBASE_STORAGE_BUCKET` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | public |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | public |
| `VITE_FIREBASE_APP_ID` | `NEXT_PUBLIC_FIREBASE_APP_ID` | public |
| `VITE_FIREBASE_FUNCTIONS_REGION` | `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION` | public |
| `VITE_FIREBASE_*_URL` (function URLs) | `NEXT_PUBLIC_FIREBASE_*_URL` | public |
| `VITE_RECALL_DEMO` | `NEXT_PUBLIC_RECALL_DEMO` | public |
| `VITE_USE_EMULATORS` | `NEXT_PUBLIC_USE_EMULATORS` | public |
| `import.meta.env.DEV` | `process.env.NODE_ENV !== 'production'` | build-time |
| (Functions `.env`, server-only) | unchanged, server-only | **never** `NEXT_PUBLIC_` |

---

## Phase 2 — Application Parity: progress (2026-08-14)

The full Vite app has been copied into `web/` and adapted to the App Router. The Next app now builds,
typechecks, and runs the whole route surface. Vite `frontend/` remains untouched as the reference.

### What was done
- **Bulk copy-and-adapt.** `frontend/src/{components,data,lib,settings,hooks,assets}` + `app/{shell,theme}`
  + `pages` were copied into `web/src`. `pages` was renamed **`views`** (Next reserves `src/pages` for
  the legacy Pages Router; it collided). All `@/pages` imports → `@/views`.
- **Router compat shim** (`src/lib/router-compat.tsx`): maps `Link/NavLink/useNavigate/useLocation/`
  `useParams/useSearchParams/Navigate/Outlet` onto `next/link` + `next/navigation`. ~55 files migrated
  by rewriting only their import source (`react-router-dom` → `@/lib/router-compat`), not their bodies.
- **Env:** `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*` (mapped in `lib/firebase/config.ts`);
  `import.meta.env.DEV` → `process.env.NODE_ENV`.
- **Providers:** `src/app/providers.tsx` restores the App.tsx stack (Theme → Auth → Preferences →
  Toast), minus BrowserRouter. `WorkspaceProvider` scopes the `/app` layout only.
- **Shell:** `src/app/app/layout.tsx` = `RequireAuth → RequireOnboarded → WorkspaceProvider →
  RecallShell`; RecallShell's `<Outlet/>` is bridged to the route's `children` via `OutletProvider`.
- **Routes:** every route wired to its real page component (thin `'use client'` wrappers). Landing gate
  (default-landing-page preference) and nested settings (`[section]`) reproduced.
- **SSR-safety:** the Vite app was a pure client SPA. `src/components/client-only.tsx` wraps all page
  content in the root layout so pages render client-only (exact SPA parity; avoids SSR-time
  `window`/`document`/Firebase across ~500 files). `<head>` (metadata + no-flash theme script + CSS)
  still SSRs. `Portal` was made SSR-safe. A `<Suspense>` boundary satisfies `useSearchParams`.
- **Forced-dark** `(marketing)`, `(auth)`, `onboarding` layouts reproduce the Vite `<ForceTheme dark>`.

### Verified (production build, `next start`)
- `next build` ✓ · `tsc --noEmit` ✓ (0 errors) · all 25 routes return 200.
- Marketing home renders pixel-faithfully (hero, CTAs, product shot).
- `/login` renders full real UI, forced dark.
- `/app` correctly redirects to `/login` when signed out (client auth guard via the shim).

### AI integration regression — FIXED & verified (2026-08-14)
After sign-in, transcription and Recall AI were both broken. Two migration defects, both in shared
infrastructure (not Anthropic/OpenAI, not the copied client code — which diffed byte-identical):

1. **Missing function-URL env config.** The working Vite app's `frontend/.env.local` points the four
   AI function URLs at the **local Functions emulator** (`http://127.0.0.1:5001/...`). No
   `web/.env.local` existed, so `config.ts` derived **deployed** `cloudfunctions.net` URLs — which
   404 (functions aren't deployed). **Fix:** created `web/.env.local` with the `NEXT_PUBLIC_*`
   equivalents pointing at the emulator. Added dev diagnostics (`lib/firebase/diagnostics.ts`) that
   log the resolved endpoints + warn when localhost points at deployed URLs, so this can't recur silently.
2. **Dynamic route param-name mismatch.** Pages read `useParams<{ sessionId }>` (etc.), but the Next
   segments were generically named `[id]`, so `params.sessionId` was `undefined` → the Session Review
   read `sessions/undefined` → "Session not found". **Fix:** renamed segments to `[sessionId]`,
   `[projectId]`, `[personId]`, `[teamId]` to match the param names the pages read (`[section]` already matched).

**Verified in a real signed-in browser (dev):** Recall AI streamed a workspace-grounded answer (SSE,
sources, `recallAiChat` 200); pasted transcript → session created → `extractSessionReview` 200 →
Session Review rendered (summary/decisions/timeline/risks) → candidate tasks extracted with owners.

### Known issues / not yet verified
- **`whileInView` reveals blank in `next dev` only** — React Strict Mode double-invokes effects and
  framer-motion's IntersectionObserver misses the initial fire. **Works in the production build.**
  Non-blocking; revisit if it ever affects `next start`.
- **Recording (MediaRecorder) path** not yet exercised (only the paste-transcript path was tested).
- **No tests copied** (`*.test.*` were Vitest/`MemoryRouter`; removed). A Next-compatible test setup
  is a follow-up.
- **Domain `src/server/*` layer** not yet populated — `admin.ts` seam exists; no server reads added
  (all data still goes through the copied client Firebase, unchanged).
- **`state` on navigate/Link is dropped** by the shim (App Router has no history state).
