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
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${config.theme.primaryColor};
            --primary-foreground: #FFFFFF;
            --background: ${config.theme.backgroundColor};
            --foreground: ${config.theme.textColor};
            --card: ${config.theme.backgroundColor};
            --card-foreground: ${config.theme.textColor};
            --popover: ${config.theme.backgroundColor};
            --popover-foreground: ${config.theme.textColor};
            --secondary: ${config.theme.accentBackground};
            --secondary-foreground: ${config.theme.textColor};
            --muted: ${config.theme.accentBackground};
            --muted-foreground: ${config.theme.textColor}99;
            --accent: ${config.theme.primaryColor};
            --accent-foreground: #FFFFFF;
            --accent-bg: ${config.theme.accentBackground};
            --border: ${config.theme.primaryColor}25;
            --input: ${config.theme.primaryColor}25;
            --ring: ${config.theme.primaryColor};
            --chart-1: ${config.theme.primaryColor};
            --chart-2: ${config.theme.primaryColor}CC;
            --chart-3: ${config.theme.primaryColor}99;
            --chart-4: ${config.theme.primaryColor}66;
            --chart-5: ${config.theme.textColor}33;
            --sidebar: ${config.theme.backgroundColor};
            --sidebar-foreground: ${config.theme.textColor};
            --sidebar-primary: ${config.theme.primaryColor};
            --sidebar-primary-foreground: #FFFFFF;
            --sidebar-accent: ${config.theme.accentBackground};
            --sidebar-accent-foreground: ${config.theme.textColor};
            --sidebar-border: ${config.theme.primaryColor}25;
            --sidebar-ring: ${config.theme.primaryColor};
          }
        `}} />
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
