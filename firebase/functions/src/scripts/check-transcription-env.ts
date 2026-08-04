// Local-only diagnostic: does the Functions runtime actually see the transcription config?
// Loads firebase/functions/.env and prints PRESENCE booleans + the resolved model names. It NEVER
// prints the API key or its value. Run from firebase/functions:  npm run check:transcription
import 'dotenv/config'

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

const openaiKey = present('OPENAI_API_KEY')
const primary = process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || 'gpt-4o-transcribe-diarize (default)'
const fallback =
  process.env.OPENAI_TRANSCRIPTION_FALLBACK_MODEL?.trim() || process.env.OPENAI_TRANSCRIBE_FALLBACK_MODEL?.trim() || 'gpt-4o-transcribe (default)'
const providerEnv = process.env.TRANSCRIPTION_PROVIDER?.trim() || 'openai (default)'

console.log('Recall transcription environment check')
console.log('  OPENAI_API_KEY present:              ', openaiKey ? 'YES' : 'NO — MISSING')
console.log('  TRANSCRIPTION_PROVIDER:              ', providerEnv)
console.log('  Primary model (OPENAI_TRANSCRIPTION_MODEL):          ', primary)
console.log('  Fallback model (OPENAI_TRANSCRIPTION_FALLBACK_MODEL):', fallback)
console.log('  SPEECHMATICS_API_KEY present:        ', present('SPEECHMATICS_API_KEY') ? 'YES' : 'no (optional)')

if (!openaiKey) {
  console.error('\nOPENAI_API_KEY is not set in firebase/functions/.env. Copy .env.example to .env and add your key.')
  process.exit(1)
}
console.log('\nOK — the runtime can transcribe. (Restart the emulator only if you just edited .env.)')
