# Recall — Demo Setup

Exact steps to run the live, AI-powered vertical slice (Google sign-in → paste transcript →
Claude review → promote task). Commands assume macOS/zsh and are run from the repo root unless
noted. The repo already ships the **`recall-ca1ec`** Firebase project's public web config, so
for that project you can skip the frontend env vars entirely.

> **Firebase config vs. secrets.** The `VITE_FIREBASE_*` values are **not** secrets (they
> identify the project to public Firebase APIs; access is enforced by Security Rules). The
> **Anthropic API key is a real secret** and lives only server-side — never in any `VITE_`
> variable or committed file.

> **Two ways to run:** the **local, no-Blaze** path below (Firebase Emulator Suite + the key in
> `firebase/functions/.env`) is the fastest for development and demos. The **deployed** path
> (sections 2–15) uses Secret Manager and requires the Blaze plan. Start local.

---

## LOCAL ANTHROPIC SETUP WITHOUT BLAZE

Run the full AI flow on your machine with the Firebase Emulator Suite — no Blaze plan, no Secret
Manager. The Functions emulator reads the Anthropic key from `firebase/functions/.env`.

1. **Go to the functions dir:** `cd firebase/functions`
2. **Create `.env`** (copy the template): `cp .env.example .env`
3. **Add your key + model** to `firebase/functions/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...          # your real key
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```
4. **Confirm it's git-ignored:** `git check-ignore firebase/functions/.env` prints the path
   (ignored). `git status` must NOT list `firebase/functions/.env`.
5. **Install deps:** `npm install` (in `firebase/functions`), and `cd ../../frontend && npm install`.
6. **Build functions:** `cd ../firebase/functions && npm run build`.
7. **(Optional) verify the key works** without the UI: `npm run test:anthropic` — sends a tiny
   prompt and prints only the response text (never the key). Expected: `Recall local Anthropic check OK`.
8. **Start the emulators** (from `firebase/`):
   ```sh
   cd .. && firebase emulators:start --only functions,firestore,auth,storage
   ```
9. **Point the app at the emulators.** In `web/.env.local` set:
   ```
   NEXT_PUBLIC_USE_EMULATORS=true
   ```
   Then `cd web && npm run dev`. Sign in (the Auth emulator provides a local Google flow),
   then **Start Session**.
10. **Import-transcript test:** Start Session → **Import Transcript** → *Use demo transcript* →
    **Create session** → the review generates via the local function calling Anthropic.
11. **Recording test:** Start Session → **Start Recording** → speak → **Stop** → auto-analysis.
12. **Check Functions logs** in the emulator terminal (or the Emulator UI). You should see
    `extractSessionReview: start` / `done` with identifiers only — never the transcript or key.
13. **This is a local development setup, not a secure production deployment.** The key sits in a
    local file and the emulator runs on your machine.
14. **For a real public deployment,** use a secure server-side environment — Firebase Secret
    Manager (Blaze) via `firebase functions:secrets:set ANTHROPIC_API_KEY` and re-adding the
    `defineSecret` binding (see the comment in `extractSessionReview.ts`), or another backend host
    that keeps the key server-side. See sections 8–15 below.

---

## 0. Prerequisites

- Node 20+ (functions target Node 20) and npm.
- Firebase CLI: `npm install -g firebase-tools` then `firebase login`.
- **Blaze plan is required only for the deployed path** (Secret Manager + deployed Functions with
  outbound calls). The local emulator path above needs **no Blaze plan**.
- An **Anthropic API key** with access to a current model (this build defaults to
  `claude-sonnet-4-6`, configurable via `ANTHROPIC_MODEL`).

## 1. Install dependencies

```sh
cd web && npm install && cd ..
cd firebase/functions && npm install && cd ../..
```

## 2. Select / create the Firebase project

Use the existing project, or create your own and put its web config in `frontend/.env.local`
(copy `frontend/.env.example`). All `firebase` commands below run **from the `firebase/`
directory** (that's where `firebase.json` lives).

```sh
cd firebase
firebase use recall-ca1ec        # or: firebase use --add   (to pick/alias another project)
```

## 3. Register the web app (only if using a new project)

Firebase Console → Project settings → Your apps → Web app → copy the config into
`frontend/.env.local` (`VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`,
`..._STORAGE_BUCKET`, `..._MESSAGING_SENDER_ID`, `..._APP_ID`).

## 4. Enable Google Authentication  *(Console — required)*

Console → **Authentication → Sign-in method → Google → Enable → Save**.

## 5. Authorized domains  *(Console — required)*

Console → **Authentication → Settings → Authorized domains** → add the domains you'll open the
app from:
- `localhost` (already present) for local dev
- your Hosting domains: `recall-ca1ec.web.app` and `recall-ca1ec.firebaseapp.com` (substitute
  your project id)

## 6. Create Firestore  *(Console — required)*

Console → **Firestore Database → Create database** (production mode, pick a region). Rules and
indexes are deployed from this repo in step 10.

## 7. Create Cloud Storage  *(Console — required)*

Console → **Storage → Get started** (accept defaults). Rules are deployed in step 10. (Storage
is only needed for the secondary audio-recording path; the core paste-transcript demo doesn't
require it.)

## 8. Configure the Anthropic secret  *(required — this is the API key)*

> ⚠️ **A previously exposed Anthropic key must NOT be reused — revoke it in the Anthropic
> Console and generate a new one.** The key lives ONLY in Firebase Secret Manager (below) — never
> in frontend source, any `VITE_` var, `.env` inside `frontend/`, Firestore, or git.

From `firebase/`:

```sh
firebase functions:secrets:set ANTHROPIC_API_KEY
# paste your NEW key when prompted
```

Optional model override (defaults to `claude-haiku-4-5`). Set it as non-secret function config
in `firebase/functions/.env` (this file holds the model name only — never the key):

```sh
printf 'ANTHROPIC_MODEL=claude-haiku-4-5\n' > functions/.env
```

The server reads `ANTHROPIC_MODEL` (falling back to `CLAUDE_MODEL`, then `claude-haiku-4-5`).
Structured Outputs is used, which is supported on `claude-haiku-4-5` and the Opus/Sonnet tiers.

## 9. Build the functions

```sh
cd firebase/functions && npm run build && cd ..
```

## 10. Deploy rules, indexes, and functions

From `firebase/`:

```sh
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

This publishes `firestore.rules`, the composite indexes, `storage.rules`, and the
`extractSessionReview` function plus the Firestore triggers. The first `functions` deploy binds
the `ANTHROPIC_API_KEY` secret from step 8.

## 11. Run the app locally

```sh
cd web && npm run dev
```

Open the printed URL (default http://localhost:3000). Sign in with Google, then **Start Session**
→ fill in the info → **Start Recording** (grant mic) → speak → **Stop** → the review is generated
automatically. The **Import Transcript** link on the same screen is the paste/testing fallback.

## 12. Deploy

The backend (Firestore rules/indexes, Storage rules, Cloud Functions) deploys from `firebase/`:

```sh
cd firebase && firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```

The Next.js app (`web/`) is deployed via its own hosting target (e.g. Vercel or a Next-aware host) —
it is **not** the retired Firebase Hosting SPA flow. The old `frontend/dist` + SPA-rewrite `hosting`
block was removed from `firebase/firebase.json` when the Vite app was deleted.

## 13. Import-transcript test (fastest, no microphone)

1. Open the deployed URL in a clean browser session → **Continue with Google**.
2. **Start Session** → **Import Transcript** → *Use demo transcript* → **Create session**.
3. The review generates automatically; watch the processing state resolve (real Anthropic call).
4. Refresh — the session and review persist; open every tab.
5. On **Tasks**, click **Add to Tasks** on a candidate → open **Tasks** in the sidebar and
   confirm the task with a valid priority/status/deadline/owner.
6. **Log out** (account menu) → confirm `/app` redirects to `/login`.

## 14. Recording test (primary flow)

1. **Start Session** → enter a title, choose **Investor Conversation** → **Start Recording**.
2. Allow microphone access; speak for ~30s. Confirm the timer, mic state, visualizer, and the
   live transcript (Chrome/Edge; Safari has partial Web Speech support).
3. **Stop** → the audio uploads to Storage, the session + transcript are saved, and analysis
   runs automatically. The review appears without a manual refresh.
4. Open the **Transcript** tab: play the recording, and map **Speaker 1 → a name**, then
   **Save & re-analyze**.

## 15. Confirm no secret is exposed in the browser

Open DevTools → Network and Sources. Confirm no request body/response and no bundled JS contains
the Anthropic key. `grep -ri "sk-ant" frontend/dist` after a build must return nothing.

---

## Local-only option: Firebase Emulator Suite

See **LOCAL ANTHROPIC SETUP WITHOUT BLAZE** at the top — that is the recommended local path.
Emulators are pre-configured in `firebase/firebase.json` (auth, firestore, storage, functions).
Set `VITE_USE_EMULATORS=true` in `frontend/.env.local` and the app auto-connects to the
emulators and points the extract-review call at the local Functions emulator (no manual URL
needed). The Anthropic key is read from `firebase/functions/.env`, which the emulator loads
automatically — you do **not** need to export it in your shell.

## Sample-data / no-auth demo mode

To showcase the UI with the original localStorage sample data and **no** Firebase/auth, build
or run with `VITE_RECALL_DEMO=true`. This is a deliberate developer control — the live app runs
without it.
