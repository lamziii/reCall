# Brand assets

**The official Recall logo now lives here** (`recall-logo-dark-mode.png`, added directly to the
repo). Everything else in this folder is derived from it:

| File | How it was made | Used by |
|---|---|---|
| `recall-logo-dark-mode.png` | Original — untouched. Full canvas with a wide soft-glow margin. | Source of truth; not imported directly (too large — 2.2MB). |
| `recall-logo-dark-mode-trimmed.png` | Cropped to the lockup's content bounding box + 50px padding. | Source for the OG image and the `.webp` export below. |
| `recall-mark-dark-mode-trimmed.png` | Icon-only crop (same source, cropped to just the rounded-square mark). | Source for the `.webp` export below. |
| `recall-logo-dark-mode.webp` | `recall-logo-dark-mode-trimmed.png` resized to 120px tall, WebP @ q90 (~10KB). | `Wordmark` (`components/branding/logo.tsx`) — the full icon+wordmark lockup used in nav/footer. |
| `recall-mark-dark-mode.webp` | `recall-mark-dark-mode-trimmed.png` resized to 96px tall, WebP @ q90 (~3KB). | `Logo` — icon-only, for contexts with no room for the wordmark. |

All of these are the **on-dark variant** (white mark, transparent background) — this app is
dark-first with no light theme, so it's the only variant actually used.

`public/favicon-32.png` / `public/favicon-64.png` are the icon crop composited onto a solid
near-black rounded-square background (so it stays visible regardless of the browser's own tab
theme) — generated the same way, not re-derivable from the `.webp` files above since those are
transparent. `public/og-image.png` (1200×630) is the same lockup composited onto a solid
near-black canvas with the "Conversations become knowledge." tagline.

If the source PNG is ever replaced with a vector original, regenerate all of the above from it —
don't hand-edit the derived files.
