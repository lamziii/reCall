// Automated tests for the LOCAL language-prioritization pass (item 8). No audio and no OpenAI —
// these exercise analyzeTranscript / applyAlbanianSpelling / finalizeTranscript on representative
// mixed-language transcript text, which is the whole surface Recall controls after OpenAI returns.
// Run: `npm run test:transcription` (or `node lib/transcription/language-metrics.test.js`).
import assert from "node:assert";
import { analyzeTranscript, applyAlbanianSpelling, finalizeTranscript } from "./language-metrics";

function run() {
  // Albanian only → predominant sq, nothing flagged unsupported.
  let m = analyzeTranscript("Përshëndetje, si jeni? Sot kemi një takim për projektin.");
  assert.equal(m.predominant, "sq", "Albanian only → sq");
  assert.equal(m.percentages.unsupported, 0, "Albanian only → no unsupported");

  // English only → predominant en.
  m = analyzeTranscript("The team is reviewing the project and we have a meeting today.");
  assert.equal(m.predominant, "en", "English only → en");

  // Albanian + English → both detected, Albanian predominant.
  m = analyzeTranscript("Kemi një meeting për sprint planning nesër.");
  assert.ok(m.detected.includes("sq") && m.detected.includes("en"), "sq+en both detected");
  assert.equal(m.predominant, "sq", "sq+en → Albanian predominant");

  // Albanian + German.
  m = analyzeTranscript("Kemi një takim në München, danke.");
  assert.ok(m.detected.includes("sq") && m.detected.includes("de"), "sq+de both detected");

  // Albanian + French.
  m = analyzeTranscript("Kemi një réunion për projektin, merci.");
  assert.ok(m.detected.includes("sq") && m.detected.includes("fr"), "sq+fr both detected");

  // Albanian names → ambiguous names follow Albanian, none flagged unsupported.
  m = analyzeTranscript("Ardit dhe Vjosa punojnë me Krasniqi.");
  assert.equal(m.predominant, "sq", "Albanian names → sq");
  assert.equal(m.percentages.unsupported, 0, "Albanian names not flagged foreign");

  // Isolated Spanish word (item 4) → flagged unsupported, but Albanian still predominant.
  m = analyzeTranscript("Sot kemi një takim, gracias, për projektin.");
  assert.ok(m.percentages.unsupported > 0, "isolated Spanish word flagged unsupported");
  assert.equal(m.predominant, "sq", "one foreign word does not flip predominant off Albanian");

  // Kosovo locations → Albanian-exonym spelling swap (item 6), whole-word only.
  assert.equal(
    applyAlbanianSpelling("We met in Kosovo near Pristina and Vushteri."),
    "We met in Kosovë near Prishtinë and Vushtrri.",
    "exonyms rewritten to Albanian spelling",
  );

  // Technical meeting vocabulary → jargon attributed to the language, not flagged foreign.
  m = analyzeTranscript("Sot do të bëjmë deploy në backend, dhe do të review sprint.");
  assert.equal(m.predominant, "sq", "Albanian tech meeting → sq");
  assert.equal(m.percentages.unsupported, 0, "tech jargon not flagged foreign");

  // finalizeTranscript gates spelling correction on predominant Albanian.
  const albanian = finalizeTranscript({ text: "Sot ishim në Kosovo.", segments: [] });
  assert.ok(albanian.text.includes("Kosovë"), "Albanian-predominant → exonym corrected");
  const english = finalizeTranscript({ text: "The team met in Kosovo for the project.", segments: [] });
  assert.ok(english.text.includes("Kosovo") && !english.text.includes("Kosovë"), "English-predominant → left as spoken");

  console.log("language-metrics tests passed");
}

run();
