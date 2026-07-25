export type SessionReview = {
  executive_summary: string;
  discussion_topics: unknown[];
  decisions: unknown[];
  tasks: unknown[];
  timeline: unknown[];
  insights: unknown[];
  risks: unknown[];
  questions: unknown[];
};

// Person B's seam — implement with Claude Haiku 4.5, defensive parsing, etc.
// Keep the return shape identical to the stub below.
export async function generateSessionReview(transcript: string): Promise<SessionReview> {
  return {
    executive_summary: `[stub] Summary pending — ${transcript.length} chars of transcript received.`,
    discussion_topics: [],
    decisions: [],
    tasks: [],
    timeline: [],
    insights: [],
    risks: [],
    questions: [],
  };
}
