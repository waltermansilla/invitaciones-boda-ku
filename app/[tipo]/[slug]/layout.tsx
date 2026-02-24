import { getClientConfig } from "@/lib/get-client-config"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ tipo: string; slug: string }>
}

export default async function ClientLayout({ children, params }: LayoutProps) {
  const { tipo, slug } = await params
  const config = getClientConfig(tipo, slug)
  const { theme } = config

  const fontFamily = theme.font.family
  const fontWeights = theme.font.weights
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}&wght@${fontWeights}&display=swap`

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        :root, html, body {
          --font-sans: '${fontFamily}', '${fontFamily} Fallback' !important;
          --primary: ${theme.primaryColor} !important;
          --primary-foreground: #FFFFFF !important;
          --background: ${theme.backgroundColor} !important;
          --foreground: ${theme.textColor} !important;
          --card: ${theme.backgroundColor} !important;
          --card-foreground: ${theme.textColor} !important;
          --popover: ${theme.backgroundColor} !important;
          --popover-foreground: ${theme.textColor} !important;
          --secondary: ${theme.accentBackground} !important;
          --secondary-foreground: ${theme.textColor} !important;
          --muted: ${theme.accentBackground} !important;
          --muted-foreground: ${theme.textColor}99 !important;
          --accent: ${theme.primaryColor} !important;
          --accent-foreground: #FFFFFF !important;
          --accent-bg: ${theme.accentBackground} !important;
          --border: ${theme.primaryColor}25 !important;
          --input: ${theme.primaryColor}25 !important;
          --ring: ${theme.primaryColor} !important;
          --chart-1: ${theme.primaryColor} !important;
          --chart-2: ${theme.primaryColor}CC !important;
          --chart-3: ${theme.primaryColor}99 !important;
          --chart-4: ${theme.primaryColor}66 !important;
          --chart-5: ${theme.textColor}33 !important;
          --sidebar: ${theme.backgroundColor} !important;
          --sidebar-foreground: ${theme.textColor} !important;
          --sidebar-primary: ${theme.primaryColor} !important;
          --sidebar-primary-foreground: #FFFFFF !important;
          --sidebar-accent: ${theme.accentBackground} !important;
          --sidebar-accent-foreground: ${theme.textColor} !important;
          --sidebar-border: ${theme.primaryColor}25 !important;
          --sidebar-ring: ${theme.primaryColor} !important;
        }
      `}} />
      {children}
    </>
  )
}
