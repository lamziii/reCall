import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";
import { getDefaultProvider } from "./transcription/registry";
import { validateAudio } from "./transcription/validate-audio";
import { pickLanguageHint, PRIMARY_LANGUAGE, parseExpectedLanguages } from "./transcription/supported-languages";
import { buildWorkspaceVocabulary, VOCABULARY_VERSION } from "./transcription/workspace-vocabulary";
import { isCorrectionEnabled, tryCorrectTranscript, type CorrectionResult } from "./correctTranscript";
import { isAiConfigured } from "./aiEnvironment";

// POST /transcribeSession
//   headers: Authorization: Bearer <Firebase ID token>, X-Session-Id: <id>, Content-Type: audio/*
//            X-Audio-Duration: <seconds> (optional, client-measured — enables cost estimate)
//   body:    the raw recording bytes (browser has no Cloud Storage, so it uploads the blob here)
// Transcribes with the provider selected by TRANSCRIPTION_PROVIDER (default openai; set
// speechmatics for speaker diarization), writes { transcript, segments, speakers } onto the
// session, and returns them. Same auth + workspace membership checks as extractSessionReview.
// Provider API keys are read server-side from .env and never leave the server.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Id, X-Audio-Duration",
};

function sendError(res: any, status: number, message: string) {
  res.set(CORS_HEADERS).status(status).json({ error: message });
}

// 540s timeout + 1GiB: a long recording is now split into ~20min chunks and transcribed one after
// another (plus ffmpeg segmentation and the correction pass), so a 60-90min meeting needs well past
// the old 300s/512MiB. The diarizing Speechmatics path (batch polling) also benefits from the room.
export const transcribeSession = onRequest({ timeoutSeconds: 540, memory: "1GiB" }, async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(CORS_HEADERS).status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    sendError(res, 405, "Method not allowed — use POST.");
    return;
  }

  const sessionId = (req.get("x-session-id") || (req.query.session_id as string) || "").trim();
  if (!sessionId) {
    sendError(res, 400, "Missing X-Session-Id header.");
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
    uid = (await getAuth().verifyIdToken(idToken)).uid;
  } catch {
    sendError(res, 401, "Invalid or expired auth token.");
    return;
  }

  const sessionRef = db.doc(`sessions/${sessionId}`);
  const snap = await sessionRef.get();
  if (!snap.exists) {
    sendError(res, 404, "Session not found.");
    return;
  }
  const workspaceId = snap.data()?.workspace_id as string | undefined;
  if (!workspaceId) {
    sendError(res, 404, "Session not found.");
    return;
  }
  const member = await db.doc(`workspaces/${workspaceId}/members/${uid}`).get();
  if (!member.exists) {
    // Same response as a missing session — don't leak existence to non-members.
    sendError(res, 404, "Session not found.");
    return;
  }

  // Language hint (item 3): whatever Recall knows — meeting languages on the session, then the
  // workspace's languages/default — collapsed to the ONE supported code OpenAI accepts, Albanian
  // first on ties, defaulting to Albanian when nothing supported is known. Fields are optional
  // (not in the schema yet); absent ones are simply ignored.
  const sessionData = snap.data() ?? {};
  const workspaceData = (await db.doc(`workspaces/${workspaceId}`).get()).data() ?? {};

  // Expected meeting languages (SOFT hints, not a filter — see PART 4). Default sq+en.
  const expectedLanguages = parseExpectedLanguages(sessionData.expected_languages);
  const languageHint =
    pickLanguageHint([
      ...expectedLanguages,
      sessionData.language,
      ...(Array.isArray(sessionData.languages) ? sessionData.languages : []),
      workspaceData.default_language,
      ...(Array.isArray(workspaceData.languages) ? workspaceData.languages : []),
    ]) ?? PRIMARY_LANGUAGE;

  // Vocabulary: default Albanian + real workspace-scoped names/terms (PART 3). Feeds both the OpenAI
  // prompt bias and the correction layer. Best-effort — never blocks transcription.
  let vocabulary: string[] = [];
  let vocabDynamicCount = 0;
  try {
    const built = await buildWorkspaceVocabulary({
      workspaceId,
      workspaceName: typeof workspaceData.name === "string" ? workspaceData.name : null,
      currentSession: sessionData,
    });
    vocabulary = built.vocabulary;
    vocabDynamicCount = built.dynamicCount;
  } catch (err) {
    logger.warn("transcribeSession: vocabulary build failed", { session_id: sessionId, message: err instanceof Error ? err.message : String(err) });
  }

  const provider = getDefaultProvider();
  if (!provider.isConfigured()) {
    logger.error("transcribeSession: provider not configured", { session_id: sessionId, workspace_id: workspaceId, provider: provider.name });
    sendError(res, 503, "AI transcription is not configured for the Functions runtime.");
    return;
  }

  const audio = req.rawBody as Buffer | undefined;
  const contentType = req.get("content-type") || "audio/webm";
  const durationHeader = Number(req.get("x-audio-duration"));
  const durationHintSeconds = Number.isFinite(durationHeader) && durationHeader > 0 ? durationHeader : undefined;

  const validationError = validateAudio({ byteLength: audio?.length ?? 0, mimeType: contentType, durationSeconds: durationHintSeconds });
  if (validationError) {
    sendError(res, 413, validationError);
    return;
  }

  logger.info("transcribeSession: start", {
    session_id: sessionId,
    workspace_id: workspaceId,
    uid,
    audio_bytes: (audio as Buffer).length,
    content_type: contentType,
    provider: provider.name,
    // Diagnostics: prove the runtime sees config WITHOUT ever printing the key or its value.
    openai_key_present: Boolean(process.env.OPENAI_API_KEY?.trim()),
    transcription_provider_env: process.env.TRANSCRIPTION_PROVIDER || "(default openai)",
    primary_model: process.env.OPENAI_TRANSCRIPTION_MODEL || process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe-diarize",
    fallback_model: process.env.OPENAI_TRANSCRIPTION_FALLBACK_MODEL || process.env.OPENAI_TRANSCRIBE_FALLBACK_MODEL || "gpt-4o-transcribe",
  });

  let out;
  try {
    out = await provider.transcribe({
      audio: audio as Buffer,
      mimeType: contentType,
      language: languageHint,
      enableDiarization: true,
      vocabulary,
      durationHintSeconds,
    });
  } catch (err) {
    // Record the failure on the session so the client can show "retry" without guessing — and so
    // Claude is never auto-run on the leftover browser transcript.
    logger.error("transcribeSession: provider failed", {
      session_id: sessionId,
      provider: provider.name,
      // NB: key must NOT be `message` — it collides with firebase logger's own structured
      // `message` field and silently drops the error text (this hid a 1400s-cap 400 for a while).
      detail: err instanceof Error ? err.message : String(err),
    });
    await sessionRef
      .update({
        transcription_status: "failed",
        transcription_error: "Couldn't transcribe the audio. Please retry.",
        updated_at: FieldValue.serverTimestamp(),
      })
      .catch(() => {});
    sendError(res, 502, "Couldn't transcribe the audio. Your recording is saved — please try again.");
    return;
  }

  if (!out.text || out.text.trim().length === 0) {
    await sessionRef
      .update({ transcription_status: "failed", transcription_error: "No speech was detected in this recording.", updated_at: FieldValue.serverTimestamp() })
      .catch(() => {});
    sendError(res, 422, "No speech was detected in this recording.");
    return;
  }

  // Preserve the RAW OpenAI transcript intact — it's stored separately (raw_transcript/raw_segments)
  // so we can always recover it. The correction layer runs on a copy; speakers + timestamps are
  // never touched. On any failure we keep the raw transcript (correction can only improve, not lose).
  const rawText = out.text;
  const rawSegments = out.segments;
  let finalText = rawText;
  let finalSegments = rawSegments;
  let correction: CorrectionResult | null = null;
  let correctionStatus: "applied" | "none" | "failed" | "skipped" = "skipped";

  if (isCorrectionEnabled() && isAiConfigured()) {
    const lines = rawSegments.length ? rawSegments.map((s) => s.text) : [rawText];
    correction = await tryCorrectTranscript(lines, { expectedLanguages, vocabulary, logContext: { session_id: sessionId } });
    if (correction) {
      if (rawSegments.length) {
        finalSegments = rawSegments.map((s, i) => ({ ...s, text: correction!.lines[i] ?? s.text }));
        finalText = finalSegments.map((s) => s.text).join(" ");
      } else {
        finalText = correction.lines[0] ?? rawText;
      }
      correctionStatus = correction.applied.length ? "applied" : "none";
      logger.info("transcribeSession: correction done", {
        session_id: sessionId,
        applied: correction.applied.length,
        flagged: correction.flaggedCount,
        estimated_cost: correction.estimatedCost,
        processing_ms: correction.processingMs,
      });
    } else {
      correctionStatus = "failed";
    }
  }

  // SUCCESS: the OpenAI transcript (AI-corrected when available) is now the source of truth. Store the
  // corrected version as `transcript`/`segments`, keep the raw version + correction metadata alongside.
  await sessionRef.update({
    transcript: finalText,
    segments: finalSegments,
    speakers: out.speakers,
    detected_language: out.detectedLanguage ?? null,
    // Raw + correction metadata (PART 8/12/13). transcript/segments already hold the corrected version.
    raw_transcript: rawText,
    raw_segments: rawSegments,
    corrections: correction?.applied ?? [],
    correction_status: correctionStatus,
    correction_model: correction?.model ?? null,
    correction_flagged_count: correction?.flaggedCount ?? 0,
    correction_cost: correction
      ? {
          input_tokens: correction.usage?.inputTokens ?? null,
          output_tokens: correction.usage?.outputTokens ?? null,
          estimated_cost: correction.estimatedCost ?? null,
          processing_ms: correction.processingMs,
        }
      : null,
    expected_languages: expectedLanguages,
    vocabulary_version: VOCABULARY_VERSION,
    vocabulary_dynamic_count: vocabDynamicCount,
    language_metrics: out.languageMetrics ?? null,
    transcription_status: "complete",
    transcription_provider: out.provider,
    transcription_model: out.model ?? null,
    transcription_error: null,
    updated_at: FieldValue.serverTimestamp(),
  });

  logger.info("transcribeSession: done", {
    session_id: sessionId,
    provider: out.provider,
    model: out.model,
    diarized: out.diarized,
    segments: finalSegments.length,
    speakers: out.speakers.length,
    language: out.detectedLanguage,
    language_hint: languageHint,
    language_metrics: out.languageMetrics,
  });
  res.set(CORS_HEADERS).status(200).json({
    transcript: finalText,
    segments: finalSegments,
    speakers: out.speakers,
    detected_language: out.detectedLanguage ?? null,
    provider: out.provider,
    model: out.model ?? null,
    diarized: out.diarized,
  });
});
