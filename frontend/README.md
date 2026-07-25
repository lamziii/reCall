# frontend/

Recall's React (Vite) + Tailwind app.

This is where Person A's UI lives: reusable components, design tokens, and every page.
See [`../docs/PERSON_A_FRONTEND.md`](../docs/PERSON_A_FRONTEND.md) for scope and checklist,
and [`../docs/Design/`](../docs/Design/) for the design system source of truth.

The full reusable component library and design tokens live under `src/` and are demonstrated
at `/dev/design` (run `npm run dev` and visit that route). Component-level docs — categories,
import patterns, composition rules, accessibility rules, and "when to add a new component" —
live in [`src/components/README.md`](./src/components/README.md).

## Scripts

```bash
npm run dev        # start the dev server
npm run build       # typecheck (tsc -b) + production build
npm run lint         # oxlint
npm run test          # run the test suite once (vitest run)
npm run test:watch    # run tests in watch mode
```

## Structure

```
src/
  app/            App root + providers (ToastProvider, router)
  components/     The reusable component library — see src/components/README.md
  hooks/          Shared React hooks (useControllableState, useClickOutside, ...)
  lib/utils/      cn(), mergeRefs, popover positioning
  pages/dev/      /dev/design — the component showcase (not a product page)
  routes/         Route definitions
  styles/tokens/  Design tokens (colors, typography, spacing, radius, shadow, motion, z-index)
  styles/animations/  Shared Framer Motion presets
  test/           Vitest setup (jsdom polyfills, jest-dom matchers)
```

## Testing

Vitest + React Testing Library + user-event + jest-dom. Test files sit next to the component
they cover (`button.tsx` → `button.test.tsx`). We test behavior and accessibility — keyboard
interaction, focus management, aria wiring, live regions — not snapshots.

`src/test/setup.ts` polyfills two things jsdom doesn't implement: `window.matchMedia` and
`<dialog>`'s `showModal()`/`close()`. If a new test needs `navigator.clipboard`, spy on the
existing stub there (`vi.spyOn(navigator.clipboard, 'writeText')`) rather than replacing the
object — replacing it mid-test loses the reference across `userEvent`'s async click dispatch.
