// Server-only accessor for the Anthropic configuration. In local development the values come
// from firebase/functions/.env (auto-loaded by the Firebase emulator/runtime; loaded via
// dotenv/config in standalone scripts). In production they come from the deploy environment or
// Secret Manager. This module must never be imported by frontend code, and the returned object
// must never be logged or returned in an API response.

export interface AiEnvironment {
  apiKey: string
  model: string
}

const DEFAULT_MODEL = 'claude-sonnet-4-6'

/**
 * Reads and validates the Anthropic env. Throws a key-free error when the API key is missing so
 * callers can surface a safe "AI not configured" message. The API key value never appears in the
 * thrown message.
 */
export function getAiEnvironment(): AiEnvironment {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  const model = process.env.ANTHROPIC_MODEL?.trim() || process.env.CLAUDE_MODEL?.trim() || DEFAULT_MODEL

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured for the Firebase Functions runtime.')
  }

  return { apiKey, model }
}

/** True when the Anthropic key is present — for a pre-call configuration check without throwing. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}
