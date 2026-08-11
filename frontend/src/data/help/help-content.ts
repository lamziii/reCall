/**
 * Static content for the in-app Help Center (`/app/help`). Plain data on purpose — no CMS, no
 * network fetch — so it ships in the same build as the app and stays in sync with what's actually
 * shipped. Add articles here; the page's search/category UI is driven entirely by this list.
 */

export interface HelpArticle {
  id: string
  question: string
  answer: string
}

export interface HelpCategory {
  id: string
  label: string
  description: string
  articles: HelpArticle[]
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    description: 'The basics: workspaces, your first session, and finding your way around.',
    articles: [
      {
        id: 'what-is-recall',
        question: 'What does Recall actually do?',
        answer:
          'Recall turns a recorded or pasted conversation into a structured, trackable workspace. Record a session (or import a transcript), and an AI step produces a Session Review — summary, decisions, tasks, timeline, insights, risks, and open questions. You can promote any candidate task straight onto your task board.',
      },
      {
        id: 'first-session',
        question: 'How do I record my first session?',
        answer:
          'Go to Sessions → Record, allow microphone access, and start talking — you\'ll see a live transcript as you go. When you stop, Recall uploads the audio and runs it through transcription and AI analysis; the Session Review appears in real time as it\'s generated.',
      },
      {
        id: 'import-transcript',
        question: 'Can I use Recall without recording audio?',
        answer:
          'Yes — paste or import an existing transcript instead of recording. Recall runs the same AI analysis on it and produces the same Session Review (summary, decisions, tasks, timeline, insights, risks, open questions).',
      },
      {
        id: 'workspace',
        question: 'What is a workspace?',
        answer:
          'A workspace is your team\'s shared home in Recall — sessions, tasks, projects, and people all live inside one. It\'s created automatically the first time you sign in, and you can invite teammates to it from Settings.',
      },
    ],
  },
  {
    id: 'recording',
    label: 'Recording & transcription',
    description: 'Microphones, live transcripts, languages, and what happens to your audio.',
    articles: [
      {
        id: 'live-transcript-accuracy',
        question: 'Why does the live transcript look rougher than the final one?',
        answer:
          'The live transcript during recording uses your browser\'s built-in speech recognition, which is fast but approximate. After you stop, Recall re-transcribes the full audio server-side for a cleaner, more accurate transcript that the AI review is built from.',
      },
      {
        id: 'languages',
        question: 'What languages are supported?',
        answer:
          'Server-side transcription supports multiple languages. If your live browser transcript doesn\'t support your language well, don\'t worry — the final transcript is generated after upload and is generally far more accurate.',
      },
      {
        id: 'speaker-labels',
        question: 'Can I label who said what?',
        answer:
          'Yes. Open a session\'s Transcript tab and map each detected "Speaker N" to a real name. Save & re-analyze to refresh the AI review with the corrected speaker labels.',
      },
      {
        id: 'audio-storage',
        question: 'Where is my recorded audio stored?',
        answer:
          'Audio uploads to private cloud storage scoped to your workspace — only members of your workspace can access it. You can play it back from the session\'s Transcript tab.',
      },
    ],
  },
  {
    id: 'session-review',
    label: 'Sessions & AI review',
    description: 'How the Session Review is generated and what each section means.',
    articles: [
      {
        id: 'review-sections',
        question: 'What\'s in a Session Review?',
        answer:
          'An executive summary, discussion topics, decisions made, a timeline, insights, risks, open questions, and candidate tasks extracted from the conversation — all generated from the transcript by AI.',
      },
      {
        id: 'review-processing',
        question: 'Why does my Session Review say "processing"?',
        answer:
          'The AI review runs after transcription finishes, so there\'s a short delay after you stop recording. The page updates automatically in real time — you don\'t need to refresh. If it stays on "processing" for several minutes, try reopening the session.',
      },
      {
        id: 'promote-task',
        question: 'How do I turn a candidate task into a real task?',
        answer:
          'On the session\'s Tasks tab, click "Promote" on any candidate task. It\'s added to your workspace\'s Tasks board immediately, and promoting the same candidate twice won\'t create a duplicate.',
      },
      {
        id: 'edit-review',
        question: 'Can I correct something the AI got wrong?',
        answer:
          'Yes — fix speaker names or transcript text and choose "Save & re-analyze" to regenerate the review from the corrected transcript.',
      },
    ],
  },
  {
    id: 'tasks-projects',
    label: 'Tasks & projects',
    description: 'Tracking action items and organizing sessions into projects.',
    articles: [
      {
        id: 'task-sources',
        question: 'What\'s the difference between a promoted task and a manual task?',
        answer:
          'Both end up on the same Tasks board and behave identically. A promoted task originated as an AI-suggested candidate from a Session Review; a manual task is one you typed in directly from the Tasks page.',
      },
      {
        id: 'task-status',
        question: 'How do I change a task\'s status?',
        answer:
          'Change it inline from the Tasks board — the update is saved immediately and is visible to the rest of your workspace in real time.',
      },
      {
        id: 'projects-grouping',
        question: 'What are projects for?',
        answer:
          'Projects group related sessions and tasks together — useful when the same initiative spans multiple meetings over time.',
      },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar & scheduling',
    description: 'Scheduling meetings and getting reminders.',
    articles: [
      {
        id: 'schedule-meeting',
        question: 'Can I schedule a meeting from Recall?',
        answer:
          'Yes — use "Schedule meeting" from the Calendar page to set up a future session. It shows up on your calendar and you\'ll get an in-app reminder as it approaches.',
      },
    ],
  },
  {
    id: 'teams-people',
    label: 'Teams & people',
    description: 'Inviting teammates, roles, and managing your roster.',
    articles: [
      {
        id: 'invite-teammate',
        question: 'How do I invite a teammate?',
        answer:
          'From Settings → Workspace, enter their email and choose a role (admin or member). They\'ll be added to your workspace once they sign in.',
      },
      {
        id: 'roles',
        question: 'What can each role do?',
        answer:
          'Owners have full control including billing and removing members. Admins can manage members and workspace settings. Members can record sessions, and view/edit shared sessions, tasks, and projects.',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & plans',
    description: 'Trials, usage limits, and managing your plan.',
    articles: [
      {
        id: 'free-trial',
        question: 'How does the free trial work?',
        answer:
          'New workspaces start on a free trial with full access — no card required. You can see how many days are left on the Usage page.',
      },
      {
        id: 'usage-limits',
        question: 'What happens if I hit my monthly recording limit?',
        answer:
          'You\'ll see your remaining minutes on the Usage page as you approach the cap. You can add extra hours on top of your plan at any time from there.',
      },
      {
        id: 'change-plan',
        question: 'How do I change or cancel my plan?',
        answer:
          'Manage your plan from Settings → Billing, or from the "Manage plan" button on the Usage page.',
      },
    ],
  },
  {
    id: 'account-security',
    label: 'Account & security',
    description: 'Sign-in, data handling, and privacy.',
    articles: [
      {
        id: 'sign-in-methods',
        question: 'How can I sign in?',
        answer:
          'With Google sign-in, or email and password. Your account is tied to whichever method you used to sign up.',
      },
      {
        id: 'data-training',
        question: 'Is my data used to train AI models?',
        answer:
          'No. Your conversations are never used to train any model. They\'re encrypted in transit and at rest, and only accessible to members of your workspace.',
      },
      {
        id: 'delete-data',
        question: 'Can I delete my data?',
        answer:
          'Yes — reach out via Contact support and we\'ll help you export or permanently delete your workspace data.',
      },
    ],
  },
]

export function searchHelpArticles(query: string): HelpCategory[] {
  const q = query.trim().toLowerCase()
  if (!q) return HELP_CATEGORIES

  return HELP_CATEGORIES.map((category) => ({
    ...category,
    articles: category.articles.filter(
      (article) => article.question.toLowerCase().includes(q) || article.answer.toLowerCase().includes(q),
    ),
  })).filter((category) => category.articles.length > 0)
}
