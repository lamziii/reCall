# api/

Person B's role doc is [`../docs/PERSON_B_API.md`](../docs/PERSON_B_API.md), but the Firebase
Cloud Functions themselves live in [`../firebase/functions/`](../firebase/functions/) — that's
where the Firebase CLI expects them for `firebase deploy --only functions` to find them. (The
backend was originally built on Supabase Edge Functions and migrated to Firebase Cloud
Functions — see the [2026-07-25 entries](../docs/CONTRACT_CHANGES.md) in
`CONTRACT_CHANGES.md`.)

`extractSessionReview` is scaffolded there (see
[`../firebase/functions/src/extractSessionReview.ts`](../firebase/functions/src/extractSessionReview.ts)):
it handles the request/response contract and the `session_reviews` write, but calls out to
[`generateSessionReview.ts`](../firebase/functions/src/generateSessionReview.ts)
for the actual AI call, which is currently a stub — **that's Person B's to implement** per
`PERSON_B_API.md` (Claude Haiku 4.5, defensive parsing, etc.), keeping the same return shape.
