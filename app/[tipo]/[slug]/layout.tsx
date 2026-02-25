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
        html, body {
          background-color: ${theme.backgroundColor} !important;
        }
        :root {
          --font-sans: '${fontFamily}', '${fontFamily} Fallback';
          --primary: ${theme.primaryColor};
          --primary-foreground: #FFFFFF;
          --background: ${theme.backgroundColor};
          --foreground: ${theme.textColor};
          --card: ${theme.backgroundColor};
          --card-foreground: ${theme.textColor};
          --popover: ${theme.backgroundColor};
          --popover-foreground: ${theme.textColor};
          --secondary: ${theme.accentBackground};
          --secondary-foreground: ${theme.textColor};
          --muted: ${theme.accentBackground};
          --muted-foreground: ${theme.textColor}99;
          --accent: ${theme.primaryColor};
          --accent-foreground: #FFFFFF;
          --accent-bg: ${theme.accentBackground};
          --border: ${theme.primaryColor}25;
          --input: ${theme.primaryColor}25;
          --ring: ${theme.primaryColor};
          --chart-1: ${theme.primaryColor};
          --chart-2: ${theme.primaryColor}CC;
          --chart-3: ${theme.primaryColor}99;
          --chart-4: ${theme.primaryColor}66;
          --chart-5: ${theme.textColor}33;
          --sidebar: ${theme.backgroundColor};
          --sidebar-foreground: ${theme.textColor};
          --sidebar-primary: ${theme.primaryColor};
          --sidebar-primary-foreground: #FFFFFF;
          --sidebar-accent: ${theme.accentBackground};
          --sidebar-accent-foreground: ${theme.textColor};
          --sidebar-border: ${theme.primaryColor}25;
          --sidebar-ring: ${theme.primaryColor};
        }
      `}} />
      {children}
    </>
  )
}
