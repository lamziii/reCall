import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";
import { generateSessionReview } from "./generateSessionReview";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendError(res: any, status: number, message: string) {
  res.set(CORS_HEADERS).status(status).json({ error: message });
}

// POST /extractSessionReview  { session_id, transcript }
// Requires an Authorization: Bearer <Firebase ID token> header. Returns
// { session_review: {...} } on success, or { error: "..." } — never both, never neither.
// Matches docs/CONTRACTS.md Contract 3 (endpoint path differs — see FIREBASE_SCHEMA.md /
// CONTRACT_CHANGES.md for the Supabase -> Firebase mapping).
export const extractSessionReview = onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(CORS_HEADERS).status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "Method not allowed — use POST.");
    return;
  }

  const { session_id, transcript } = req.body ?? {};
  if (typeof session_id !== "string" || typeof transcript !== "string" || !session_id || !transcript) {
    sendError(res, 400, "Request body must include session_id and transcript as strings.");
    return;
  }

  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    sendError(res, 401, "Missing Authorization: Bearer <token> header.");
    return;
  }

  let uid: string;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    sendError(res, 401, "Invalid or expired auth token.");
    return;
  }

  const sessionSnap = await db.doc(`sessions/${session_id}`).get();
  if (!sessionSnap.exists) {
    sendError(res, 404, "Session not found.");
    return;
  }

  const workspaceId = sessionSnap.data()?.workspace_id as string | undefined;
  if (!workspaceId) {
    sendError(res, 404, "Session not found.");
    return;
  }

  const memberSnap = await db.doc(`workspaces/${workspaceId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    // Same response as a missing session — don't leak whether the session exists to
    // non-members.
    sendError(res, 404, "Session not found.");
    return;
  }

  let review;
  try {
    review = await generateSessionReview(transcript);
  } catch {
    sendError(res, 502, "Failed to generate session review — please try again.");
    return;
  }

  const reviewRef = db.doc(`session_reviews/${session_id}`);
  const existing = await reviewRef.get();

  const doc = {
    session_id,
    ...review,
    updated_at: FieldValue.serverTimestamp(),
    created_at: existing.exists ? existing.data()?.created_at : FieldValue.serverTimestamp(),
  };

  await reviewRef.set(doc);
  const saved = await reviewRef.get();

  res.set(CORS_HEADERS).status(200).json({ session_review: { id: saved.id, ...saved.data() } });
});
