import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import config from '@/data/wedding-config.json'
import './globals.css'

const fontFamily = config.theme.font.family
const fontWeights = config.theme.font.weights
const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${fontWeights}&display=swap`

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: config.theme.primaryColor,
}

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={config.meta.lang} className="bg-background">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontUrl} rel="stylesheet" />
      </head>
      <body
        className="font-sans antialiased"
        style={{ fontFamily: `'${fontFamily}', system-ui, sans-serif` }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
