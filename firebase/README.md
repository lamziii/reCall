# firebase/

Person C's role doc is [`../docs/PERSON_C_DATABASE.md`](../docs/PERSON_C_DATABASE.md). The
actual Firestore schema, Security Rules, Storage rules, and Cloud Functions live here — this
is where the Firebase CLI expects them for `firebase deploy` to find them.

- [`FIREBASE_SCHEMA.md`](FIREBASE_SCHEMA.md) — Firestore collection structure, field rules,
  indexes. Source of truth for the database layer; see
  [`../docs/CONTRACTS.md`](../docs/CONTRACTS.md) for the frontend/AI-facing field contracts.
- [`firestore.rules`](firestore.rules) — Security Rules (equivalent of Supabase RLS).
- [`storage.rules`](storage.rules) — Cloud Storage access control for the `recordings` and
  `documents` file paths.
- [`firestore.indexes.json`](firestore.indexes.json) — composite indexes required by the
  queries described in `FIREBASE_SCHEMA.md`.
- [`functions/`](functions/) — Cloud Functions:
  - `extractSessionReview` — HTTP function backing Contract 3. Handles the request/response
    contract and the `session_reviews` write, but calls out to
    [`generateSessionReview.ts`](functions/src/generateSessionReview.ts) for the actual AI
    call, which is currently a stub — **that's Person B's to implement** per
    `PERSON_B_API.md` (Claude Haiku 4.5, defensive parsing, etc.), keeping the same return
    shape.
  - `onWorkspaceCreated` — auto-enrolls a new workspace's creator as its owner member.
  - `onWorkspaceUpdated` / `onSessionUpdated` / `onSessionReviewUpdated` / `onProjectUpdated`
    / `onTaskUpdated` — stamp `updated_at` on write, mirroring the Supabase `set_updated_at()`
    trigger.

## Setup

Project is created: **`recall-ca1ec`**, already set as the default project in
[`.firebaserc`](.firebaserc). The web app config is saved in
[`web-app-config.js`](web-app-config.js) — copy it into `frontend/src/lib/firebase.js` (or
`.ts`) once the frontend is scaffolded, alongside `npm i firebase`.

Still needed in the [console](https://console.firebase.google.com/project/recall-ca1ec):
confirm **Firestore Database**, **Authentication** (Email/Password and/or your chosen
providers), and **Cloud Storage** are enabled — the project may need these turned on manually
the first time.

To deploy rules/indexes/functions, from this `firebase/` directory:
```
npm install -g firebase-tools   # if not already installed
firebase login
npm --prefix functions install
firebase deploy --only firestore:rules,firestore:indexes,storage:rules,functions
```

## What to send Person C / whoever wires up the frontend

To connect the frontend to this backend, share:
- The **Firebase project's web app config** (Project Settings → General → "Your apps" → Web
  app → SDK setup and configuration). This is a small JS object (`apiKey`, `authDomain`,
  `projectId`, `storageBucket`, `messagingSenderId`, `appId`) — safe to put directly in
  frontend code, it's not a secret.
- Nothing else needs to be shared for local development — Firestore/Storage/Functions are all
  reached through that same web config plus the client SDKs' built-in auth flow. A **service
  account key** is only needed for server-side admin scripts (not required for the app itself,
  since Cloud Functions get admin access automatically when deployed) — if one is ever needed,
  generate it via Project Settings → Service Accounts → "Generate new private key", and never
  commit it to the repo.
