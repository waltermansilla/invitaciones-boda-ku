import { getClientConfig } from "@/lib/get-client-config";
import { extraGoogleFontStylesheetHrefs } from "@/lib/section-text-style";
import { resolveThemeBodyFont } from "@/lib/theme-google-font";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ tipo: string; slug: string }>;
}

export default async function MuestraLayout({ children, params }: LayoutProps) {
    const { tipo, slug } = await params;
    const config = getClientConfig(tipo, slug);
    const { theme } = config;

    const { configuredFamily, loadGoogleFont, googleFontUrl, cssFontFamily } =
        resolveThemeBodyFont(theme as { font?: string | { family?: string; weights?: string } });
    const extraFontHrefs = extraGoogleFontStylesheetHrefs(
        config,
        configuredFamily,
    );

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            {loadGoogleFont && googleFontUrl ? (
                <link href={googleFontUrl} rel="stylesheet" />
            ) : null}
            {extraFontHrefs.map((href) => (
                <link key={href} href={href} rel="stylesheet" />
            ))}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        html, body {
          background-color: ${theme.backgroundColor} !important;
          font-family: ${cssFontFamily} !important;
        }
        * {
          font-family: inherit;
        }
        :root {
          --font-sans: ${cssFontFamily};
          --font-serif: ${cssFontFamily};
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
      `,
                }}
            />
            {children}
        </>
    );
}
