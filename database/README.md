# database/

Person C's role doc is [`../docs/PERSON_C_DATABASE.md`](../docs/PERSON_C_DATABASE.md), but the
actual Firestore schema, Security Rules, Storage rules, and Cloud Functions live in
[`../firebase/`](../firebase/) — that's where the Firebase CLI expects them for
`firebase deploy` to find them. (The backend was originally built on Supabase/Postgres and
migrated to Firebase/Firestore — see the
[2026-07-25 entries](../docs/CONTRACT_CHANGES.md) in `CONTRACT_CHANGES.md`.)

Frontend/AI-facing field contracts for the collections here are documented in
[`../docs/CONTRACTS.md`](../docs/CONTRACTS.md).
