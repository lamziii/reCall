# Missing marketing assets

- `recall-session-review.webp` — **resolved.** A real Session Review screenshot was added at
  `src/assets/marketing/image.png` and re-encoded as `recall-session-review.webp` (same
  1586×992 resolution, WebP q88 — 1.45MB → 78KB; see `image.png` if you need the original). The
  hero (`src/pages/home/hero.tsx`) uses it directly. `recall-session-review-mobile.webp` still
  doesn't exist — the same asset is used at all breakpoints via `w-full` scaling; add a
  dedicated mobile crop only if the full screenshot proves too small to read on narrow viewports.
- `knowledge-objects.webp` — still missing. `ValueStatement` uses `KnowledgeObjectsMockup`
  (`src/pages/home/visuals/knowledge-objects-mockup.tsx`), a React mockup built from existing
  `@/components`.
- `recall-workflow.webp` — still missing. `Workflow` uses `WorkflowMockup`
  (`src/pages/home/visuals/workflow-mockup.tsx`), same approach.
- `recall-og-image.webp` — resolved differently: `public/og-image.png`, composited from the
  real logo (see `src/assets/branding/README.md`).

Replace `KnowledgeObjectsMockup`/`WorkflowMockup` with real screenshots the same way the hero
image was swapped in, once those exist.
