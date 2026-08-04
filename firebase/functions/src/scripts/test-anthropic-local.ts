// Local-only smoke test for the Anthropic integration. Loads firebase/functions/.env, sends a
// tiny prompt, and prints ONLY the response text. It never prints the API key and is not part of
// the deployed function runtime (invoked via `npm run test:anthropic`).
//
// Run from firebase/functions:  npm run test:anthropic
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { getAiEnvironment } from '../aiEnvironment'

async function main() {
  let env
  try {
    env = getAiEnvironment()
  } catch {
    // Key-free message — do not echo env vars.
    console.error('ANTHROPIC_API_KEY is not set in firebase/functions/.env. Copy .env.example to .env and add your key.')
    process.exit(1)
    return
  }

  console.log(`Using model: ${env.model}`)
  const client = new Anthropic({ apiKey: env.apiKey })

  const res = (await client.messages.create({
    model: env.model,
    max_tokens: 64,
    messages: [{ role: 'user', content: 'Reply with exactly: Recall local Anthropic check OK' }],
  } as any)) as Anthropic.Messages.Message

  const text = res.content.find((b) => b.type === 'text')
  console.log('Response:', text && text.type === 'text' ? text.text.trim() : '(no text)')
}

main().catch((err) => {
  // Print only the error name/message — never headers, env, or the key.
  console.error('Anthropic request failed:', err?.name ?? 'Error', '-', err?.message ?? String(err))
  process.exit(1)
})
