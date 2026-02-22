import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import config from '@/data/wedding-config.json'
import { isDarkMode, palette } from '@/lib/theme'
import './globals.css'

const font = config.theme.font as { family: string; weights: string }
const fontFamily = font.family
const fontWeights = font.weights
const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${fontWeights}&display=swap`

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: palette.primaryColor,
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
    <html lang={config.meta.lang} className={`bg-background ${isDarkMode ? "dark-mode" : ""}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontUrl} rel="stylesheet" />
        {isDarkMode && (
          <style dangerouslySetInnerHTML={{ __html: `
            :root.dark-mode {
              --background: ${palette.backgroundColor};
              --foreground: ${palette.textColor};
              --primary: ${palette.primaryColor};
              --primary-foreground: #FFFFFF;
              --card: ${palette.backgroundColor};
              --card-foreground: ${palette.textColor};
              --popover: ${palette.backgroundColor};
              --popover-foreground: ${palette.textColor};
              --secondary: ${palette.accentBackground};
              --secondary-foreground: ${palette.textColor};
              --muted: ${palette.accentBackground};
              --muted-foreground: ${palette.textColor}80;
              --accent: ${palette.primaryColor};
              --accent-foreground: #FFFFFF;
              --border: ${palette.primaryColor}30;
              --input: ${palette.primaryColor}30;
              --ring: ${palette.primaryColor};
              --accent-bg: ${palette.accentBackground};
            }
          `}} />
        )}
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
