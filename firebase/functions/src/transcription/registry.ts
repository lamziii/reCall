// The one place that knows the set of transcription providers. Adding Deepgram/ElevenLabs/Google/
// self-hosted Whisper later = implement ./providers/<name>-provider.ts and add it to this map.
// Everything else (transcribeSession, the benchmark) goes through here.
import type { TranscriptionProvider, TranscriptionProviderName } from "./provider";
import { openaiProvider } from "./providers/openai-provider";
import { speechmaticsProvider } from "./providers/speechmatics-provider";

const PROVIDERS: Record<TranscriptionProviderName, TranscriptionProvider> = {
  openai: openaiProvider,
  speechmatics: speechmaticsProvider,
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS) as TranscriptionProviderName[];

export function isProviderName(name: string): name is TranscriptionProviderName {
  return name in PROVIDERS;
}

export function getProvider(name: TranscriptionProviderName): TranscriptionProvider {
  return PROVIDERS[name];
}

/** Providers whose API key is present — the ones the benchmark can actually run. */
export function getConfiguredProviders(): TranscriptionProvider[] {
  return PROVIDER_NAMES.map((n) => PROVIDERS[n]).filter((p) => p.isConfigured());
}

/**
 * The provider used for real session transcription. Set TRANSCRIPTION_PROVIDER=speechmatics to
 * switch to diarization; defaults to openai (matches prior behavior). Falls back to openai if the
 * configured value is unknown.
 */
export function getDefaultProvider(): TranscriptionProvider {
  const name = process.env.TRANSCRIPTION_PROVIDER?.trim();
  return name && isProviderName(name) ? PROVIDERS[name] : PROVIDERS.openai;
}
