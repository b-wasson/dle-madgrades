import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Madgrades DLE',
  description: 'Daily UW–Madison grade challenges',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 pb-16 pt-5 sm:pt-8">
          {children}
        </main>
        <p
          className="fixed bottom-3 right-4 text-xs text-right leading-relaxed"
          style={{ color: '#444', maxWidth: 280 }}
        >
          Data sourced from{' '}
          <a
            href="https://madgrades.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', color: '#444' }}
          >
            Madgrades
          </a>
          . This project is not affiliated with or endorsed by Madgrades.
        </p>
      </body>
    </html>
  )
}
