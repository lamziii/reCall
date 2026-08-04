import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { ALBANIAN_VOCABULARY } from "./transcription/albanian-vocabulary";
import type { NormalizedTranscript, TranscriptionProviderName, TranscriptionRequest } from "./transcription/provider";
import { getConfiguredProviders, getProvider, isProviderName, PROVIDER_NAMES } from "./transcription/registry";
import { validateAudio } from "./transcription/validate-audio";

// POST /benchmarkTranscription — internal tool. Runs ONE uploaded audio file through several
// transcription providers concurrently and returns each NormalizedTranscript so we can compare
// Albanian/mixed-language/diarization quality before committing to a provider.
//
//   headers: Authorization: Bearer <Firebase ID token>, Content-Type: audio/*
//            X-Providers: openai,speechmatics   (default: all configured)
//            X-Language: sq | en                (optional; omit to auto-detect)
//            X-Diarization: true | false        (default true)
//            X-Expected-Speakers: <n>           (optional)
//            X-Audio-Duration: <seconds>        (optional; client-measured, for cost estimate)
//   body:    the raw audio bytes
//
// Auth: any signed-in user (internal/benchmark surface). ponytail: gate to an allow-list of
// admin UIDs if this ever ships beyond internal use — keys are server-side but calls cost money.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Providers, X-Language, X-Diarization, X-Expected-Speakers, X-Audio-Duration",
};

function sendError(res: any, status: number, message: string) {
  res.set(CORS_HEADERS).status(status).json({ error: message });
}

// Drop rawResponse before returning — keeps the payload small; nothing downstream needs it.
function publicResult(r: NormalizedTranscript) {
  const { rawResponse: _drop, ...rest } = r;
  return rest;
}

export const benchmarkTranscription = onRequest({ timeoutSeconds: 300, memory: "512MiB" }, async (req, res) => {
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
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(idToken)).uid;
  } catch {
    sendError(res, 401, "Invalid or expired auth token.");
    return;
  }

  const audio = req.rawBody as Buffer | undefined;
  const mimeType = req.get("content-type") || "audio/webm";
  const durationHeader = Number(req.get("x-audio-duration"));
  const durationHintSeconds = Number.isFinite(durationHeader) && durationHeader > 0 ? durationHeader : undefined;

  const validationError = validateAudio({ byteLength: audio?.length ?? 0, mimeType, durationSeconds: durationHintSeconds });
  if (validationError) {
    sendError(res, 413, validationError);
    return;
  }

  // Which providers to run: requested ∩ configured. Default = all configured.
  const requested = (req.get("x-providers") || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const badNames = requested.filter((n) => !isProviderName(n));
  if (badNames.length) {
    sendError(res, 400, `Unknown provider(s): ${badNames.join(", ")}. Known: ${PROVIDER_NAMES.join(", ")}.`);
    return;
  }
  const configured = getConfiguredProviders();
  const selected = (requested.length ? (requested as TranscriptionProviderName[]).map(getProvider) : configured).filter((p) =>
    p.isConfigured(),
  );
  if (!selected.length) {
    sendError(res, 503, "No transcription providers are configured on the server. Set OPENAI_API_KEY and/or SPEECHMATICS_API_KEY.");
    return;
  }

  const language = (req.get("x-language") || "").trim() || undefined;
  const enableDiarization = (req.get("x-diarization") || "true").toLowerCase() !== "false";
  const expectedRaw = Number(req.get("x-expected-speakers"));
  const expectedSpeakers = Number.isFinite(expectedRaw) && expectedRaw > 0 ? expectedRaw : undefined;

  const request: TranscriptionRequest = {
    audio: audio as Buffer,
    mimeType,
    language,
    enableDiarization,
    expectedSpeakers,
    vocabulary: ALBANIAN_VOCABULARY,
    durationHintSeconds,
  };

  logger.info("benchmarkTranscription: start", {
    uid,
    providers: selected.map((p) => p.name),
    audio_bytes: audio?.length,
    mime: mimeType,
    language: language ?? "auto",
    diarization: enableDiarization,
  });

  // Run every provider concurrently; one failure doesn't sink the others.
  const settled = await Promise.allSettled(selected.map((p) => p.transcribe(request)));

  const results: ReturnType<typeof publicResult>[] = [];
  const errors: Array<{ provider: string; error: string }> = [];
  settled.forEach((s, i) => {
    const name = selected[i].name;
    if (s.status === "fulfilled") {
      results.push(publicResult(s.value));
    } else {
      const message = s.reason instanceof Error ? s.reason.message : String(s.reason);
      logger.error("benchmarkTranscription: provider failed", { provider: name, message });
      errors.push({ provider: name, error: message });
    }
  });

  res.set(CORS_HEADERS).status(200).json({ results, errors });
});
