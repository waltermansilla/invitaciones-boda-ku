import { findConfigByBaseToken } from "@/lib/config-loader"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ token: string }>
}

export default async function BaseTokenLayout({ children, params }: LayoutProps) {
  const { token } = await params
  const config = findConfigByBaseToken(token)
  const primaryColorRaw = (config?.theme as Record<string, unknown> | undefined)?.primaryColor
  const primaryColor =
    typeof primaryColorRaw === "string" && primaryColorRaw.trim()
      ? primaryColorRaw.trim()
      : "#111111"

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              min-height: 100%;
              background-color: ${primaryColor} !important;
              background-image: linear-gradient(160deg, ${primaryColor} 0%, #1d1b1a 55%, #111111 100%) !important;
              background-attachment: fixed !important;
              background-repeat: no-repeat !important;
              background-size: 100% 100% !important;
            }
            body {
              color-scheme: dark;
            }
            :root {
              --base-primary-color: ${primaryColor};
            }
          `,
        }}
      />
      {children}
    </>
  )
}
