# Onboarding tour media

Drop short demo clips here and point a step's `media` at them in
`src/lib/onboarding/tutorial-config.ts` — no layout changes needed:

    media: {
      type: 'video',
      src: '/onboarding/record-session.webm',   // served from this folder
      poster: '/onboarding/record-session.jpg',
      alt: 'Recording a session in Recall.',
      aspectRatio: 16 / 9,
    }

Guidance: muted, ~5–10s loop, 16:9, WebM (or MP4) + a JPG poster.
Until a clip exists a step falls back to its themed placeholder preview
(`components/onboarding/onboarding-previews.tsx`).
