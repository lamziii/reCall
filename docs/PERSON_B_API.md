# Person B — API / AI Calling

## Responsibilities
Person B owns the "intelligence" layer: the Edge Function that receives raw notes, calls the
Claude API, and returns clean, structured task data matching the contract Person A and
Person C both depend on. This role also owns prompt design and API-layer error handling, and
the optional Whisper transcription step if time allows.

Core responsibilities:
- Build the Edge Function that calls the Claude API and returns extracted tasks
- Design and tune the extraction prompt so output is reliably well-structured
- Parse the AI's response defensively, since models don't always follow formatting
  instructions perfectly
- Handle every failure mode at the API layer and return errors in the agreed shape, never a
  raw error or stack trace
- Keep the API key secure (Supabase secret, never hardcoded or committed)
- (Stretch, only after the core endpoint is solid) add audio transcription via Whisper

## What you're building
Edge Function `extract-tasks`: takes raw notes, calls Claude, returns a clean array of
Contract 1 task objects — match Contract 2's exact request/response shape from CONTRACTS.md.

**The extraction prompt** must instruct the model to return ONLY a valid JSON array, no
other text, no markdown code fences, with fields task, owner, deadline, priority. Add the id
(uuid) and status: "todo" fields in code after parsing — don't rely on the model to generate
them correctly.

**Defensive JSON parsing:** always strip any text before the first "[" and after the last
"]" before parsing, since models sometimes wrap JSON in explanation text or code fences even
when told not to. Default owner to "Unassigned", deadline to "No deadline", and priority to
"medium" if any field is missing or invalid.

**Error handling** (return Contract 2's error shape, never throw raw errors to the client):
- Empty/missing notes → 400 with { "error": "Please paste some notes first." }
- Claude API call fails → 502 with { "error": "Couldn't reach the AI service. Try again." }
- JSON parsing fails → 500 with { "error": "Couldn't understand the AI's response. Try again." }

**Model choice:** use Claude Haiku 4.5 — cheap, fast, and sufficient for structured
extraction. Don't reach for a more expensive model for this task.

**API key:** store as a Supabase secret, never in code.

## Stretch goal — Whisper transcription
Only after core extraction works and is tested: a second Edge Function that takes an
uploaded audio file, sends it to OpenAI's Whisper endpoint, returns plain text, which then
feeds into the same extraction function above.

## Checklist
- [ ] Edge Function scaffolded and deployable
- [ ] Extraction prompt written and tested with curl/Postman against sample notes
- [ ] Response matches Contract 2 exactly ({ tasks: [...] } or { error: "..." })
- [ ] Defensive JSON parsing in place
- [ ] Error handling covers empty input, API failure, and parse failure
- [ ] API key stored as a secret, not hardcoded
- [ ] (Stretch) Whisper transcription function working end to end
