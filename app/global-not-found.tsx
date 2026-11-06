import '@/styles/globals.css'

import type { Metadata } from 'next'

// Requests outside any locale (rare — the middleware prefixes almost everything).
export const metadata: Metadata = { title: '404 — Not found' }

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-3 font-sans">
        <p className="text-muted-foreground font-mono text-sm">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        {/* Rendered outside the app router tree, so a full page load is intended. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="underline underline-offset-4">
          Back to home
        </a>
      </body>
    </html>
  )
}
