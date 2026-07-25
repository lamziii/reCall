// Edge Function: extract-session-review
// Accepts { session_id, transcript }, generates the Session Review fields (Person B's logic,
// see generateSessionReview.ts), writes them to session_reviews, and returns
// { session_review: {...} } on success or { error: "..." } on failure — never both, never
// neither. See docs/CONTRACTS.md.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateSessionReview, type SessionReview } from "./generateSessionReview.ts";

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: { session_id?: string; transcript?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  const { session_id, transcript } = body;
  if (!session_id || typeof session_id !== "string") {
    return errorResponse(400, "session_id is required.");
  }
  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    return errorResponse(400, "transcript is required and cannot be empty.");
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(401, "Missing Authorization header.");
  }

  // Scoped to the caller's JWT (not the service role key) so RLS enforces workspace
  // membership for us — this function can only ever touch a session the caller already has
  // access to, and the session_reviews write below is subject to the same RLS policy.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return errorResponse(404, "Session not found, or you don't have access to it.");
  }

  let review: SessionReview;
  try {
    review = await generateSessionReview(transcript);
  } catch (err) {
    console.error("generateSessionReview failed:", err);
    return errorResponse(502, "Couldn't generate the session review. Try again.");
  }

  const { data: savedReview, error: writeError } = await supabase
    .from("session_reviews")
    .upsert({ session_id, ...review }, { onConflict: "session_id" })
    .select()
    .single();

  if (writeError || !savedReview) {
    console.error("session_reviews write failed:", writeError);
    return errorResponse(500, "Couldn't save the session review. Try again.");
  }

  return new Response(JSON.stringify({ session_review: savedReview }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
