/**
 * Configuration-driven step list for the first-run product tour. Editing copy or reordering steps
 * is a data change here — no layout code changes. Each step's media starts as a themed placeholder
 * preview (see components/onboarding/onboarding-previews.tsx); swap `media` to a video later:
 *
 *   media: { type: 'video', src: '/onboarding/record-session.webm', poster: '/onboarding/record-session.jpg' }
 *
 * Video assets live in `frontend/public/onboarding/`.
 */

/** Bump when the tour changes materially. Stored on the profile as `tutorial_version`. */
export const ONBOARDING_VERSION = 1

export type PlaceholderKind = 'welcome' | 'record' | 'extract' | 'connected' | 'ask'

export interface OnboardingMediaSpec {
  type: 'placeholder' | 'image' | 'video'
  /** Placeholder preview to render when type === 'placeholder'. */
  placeholder?: PlaceholderKind
  /** Asset URL for image/video. */
  src?: string
  /** Poster frame for video. */
  poster?: string
  alt: string
  /** width / height, e.g. 16 / 9. Defaults to 16/9. */
  aspectRatio?: number
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  helper?: string
  media: OnboardingMediaSpec
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Your meetings, remembered.',
    description: 'Recall records your conversations and turns them into clear, searchable knowledge.',
    helper: 'Decisions, tasks, questions and projects stay connected to the meeting they came from.',
    media: { type: 'placeholder', placeholder: 'welcome', alt: 'A session turning into linked decisions, tasks and questions.' },
  },
  {
    id: 'record',
    title: 'Start with a conversation.',
    description: 'Record a meeting or import one you already have. Recall captures the conversation so you can stay focused.',
    media: { type: 'placeholder', placeholder: 'record', alt: 'The Recall recording panel with a timer, waveform and stop button.' },
  },
  {
    id: 'extract',
    title: 'Recall finds what matters.',
    description: 'After each session, Recall pulls out decisions, tasks, questions and important context automatically.',
    media: { type: 'placeholder', placeholder: 'extract', alt: 'A meeting on the left with extracted decisions, tasks and questions on the right.' },
  },
  {
    id: 'connected',
    title: 'Your work stays connected.',
    description: 'Tasks, projects and decisions link back to the conversations that created them.',
    media: { type: 'placeholder', placeholder: 'connected', alt: 'A task linked to a project and the meeting it came from.' },
  },
  {
    id: 'ask',
    title: 'Ask Recall anything.',
    description: 'Search your meetings naturally — ask what was decided, what you committed to, or what needs attention.',
    media: { type: 'placeholder', placeholder: 'ask', alt: 'The Recall AI panel answering a question with a linked source.' },
  },
]
