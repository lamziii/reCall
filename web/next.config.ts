import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'

const nextConfig: NextConfig = {
  // Foundation phase: keep this minimal. The Vite app in ../frontend stays the behavioral
  // reference until this app reaches verified parity.
  reactStrictMode: true,
  // The monorepo has multiple lockfiles (root + frontend + web); pin the workspace root to this app
  // so Turbopack resolves files from web/, not the repo root.
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  typescript: {
    // Parity build must not be blocked by type errors in half-migrated placeholder pages.
    // Flip back to false once the port is complete (tracked in docs/NEXTJS_MIGRATION.md).
    ignoreBuildErrors: false,
  },
}

export default nextConfig
