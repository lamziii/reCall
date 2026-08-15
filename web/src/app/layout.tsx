import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import '@/styles/tokens/index.css'
import { NO_FLASH_SCRIPT } from '@/lib/theme/no-flash-script'
import { ClientOnly } from '@/components/client-only'
import { Providers } from './providers'

// Ported from the Vite app's index.html <head>.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://recall.example.com'),
  title: 'Recall — Conversations become knowledge',
  description:
    'Recall transforms meetings into structured decisions, tasks, insights, and searchable organizational knowledge.',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Recall',
    title: 'Recall — Conversations become knowledge',
    description:
      'Recall transforms meetings into structured decisions, tasks, insights, and searchable organizational knowledge.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recall — Conversations become knowledge',
    description:
      'Recall transforms meetings into structured decisions, tasks, insights, and searchable organizational knowledge.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the no-flash script mutates <html data-*> before hydration, so the
    // server markup intentionally differs from the post-script client DOM.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking, classic script — runs before first paint to prevent a theme/appearance flash. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        {/* Suspense boundary required because the router-compat useLocation/useSearchParams read
            next/navigation's useSearchParams; it also covers every route's client search-params use. */}
        <Providers>
          {/* Client-only page content (Vite SPA parity — see ClientOnly). Suspense satisfies the
              router-compat useSearchParams boundary requirement. */}
          <Suspense fallback={null}>
            <ClientOnly>{children}</ClientOnly>
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
