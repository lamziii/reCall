import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { getDefaultProvider } from "./transcription/registry";
import { validateAudio } from "./transcription/validate-audio";

// POST /transcribeVoice
//   headers: Authorization: Bearer <Firebase ID token>, Content-Type: audio/*
//            X-Audio-Duration: <seconds> (optional, client-measured)
//   body:    raw recorded audio bytes (a short voice snippet from the Recall AI composer)
// Transcribes a single-speaker voice message with the configured OpenAI model (plain path — no
// diarization, so it's cheaper/faster than the meeting pipeline) and returns { text }. Unlike
// transcribeSession this writes nothing to Firestore and needs no workspace/session — it's just
// "turn my voice into text for the chat box". Auth is required so the OpenAI key is never exposed.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Audio-Duration",
};

function sendError(res: any, status: number, message: string) {
  res.set(CORS_HEADERS).status(status).json({ error: message });
}

export const transcribeVoice = onRequest({ timeoutSeconds: 120, memory: "512MiB" }, async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(CORS_HEADERS).status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    sendError(res, 405, "Method not allowed — use POST.");
    return;
  }

  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    sendError(res, 401, "Missing Authorization: Bearer <token> header.");
    return;
  }
  try {
    await getAuth().verifyIdToken(idToken);
  } catch {
    sendError(res, 401, "Invalid or expired auth token.");
    return;
  }

  const provider = getDefaultProvider();
  if (!provider.isConfigured()) {
    sendError(res, 503, "Voice transcription is not configured on the server.");
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

  let out;
  try {
    // enableDiarization:false → the plain gpt-4o-transcribe path (single speaker, lower cost).
    out = await provider.transcribe({ audio: audio as Buffer, mimeType: contentType, enableDiarization: false, durationHintSeconds });
  } catch (err) {
    logger.error("transcribeVoice: provider failed", { detail: err instanceof Error ? err.message : String(err) });
    sendError(res, 502, "Couldn't transcribe that. Please try again.");
    return;
  }

  res.set(CORS_HEADERS).status(200).json({ text: out.text ?? "" });
});
