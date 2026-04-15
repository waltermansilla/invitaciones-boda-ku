import QRCardXV from "@/components/wedding/qr-card-xv"
import { getClientConfig, type ClientConfig } from "@/lib/get-client-config"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Blank page component
function BlankPage() {
  return <div style={{ width: "100vw", height: "100dvh", backgroundColor: "#fff" }} />
}

export default async function QRPage({ params }: PageProps) {
  const { slug } = await params
  
  let data: ClientConfig
  try {
    data = getClientConfig("xv", slug)
  } catch {
    return <BlankPage />
  }
  
  // Get QR config from JSON
  const qrConfig = data.qrCard
  const meta = data.meta || {}
  const design = data.design || {}
  
  // If qrCard doesn't exist or is disabled, show blank page
  if (!qrConfig || qrConfig.enabled === false) {
    return <BlankPage />
  }

  // Build invitation URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://momentounico.com.ar"
  const invitationUrl = qrConfig.qrUrl || `${baseUrl}/xv/${slug}`

  return (
    <QRCardXV
      names={{
        text1: qrConfig.names?.text1 || "Mis XV",
        text2: qrConfig.names?.text2 || meta.quinceaneraName || "Valentina",
        font1: qrConfig.names?.font1 || "'Cormorant Garamond', serif",
        font2: qrConfig.names?.font2 || "'Great Vibes', cursive",
      }}
      icon={qrConfig.icon || "sparkles"}
      title={qrConfig.title || "Comparti tus fotos"}
      description={qrConfig.description || "Subi tus fotos de la fiesta y ayudame a guardar los recuerdos de este dia tan especial"}
      qrUrl={invitationUrl}
      qrStyle={{
        fgColor: qrConfig.qrStyle?.fgColor || "#3D3D3D",
        bgColor: qrConfig.qrStyle?.bgColor || "transparent",
        cornerStyle: qrConfig.qrStyle?.cornerStyle || "rounded",
      }}
      cardStyle={{
        bgColor: qrConfig.cardStyle?.bgColor || "#FDF8F3",
        textColor: qrConfig.cardStyle?.textColor || "#3D3D3D",
        accentColor: qrConfig.cardStyle?.accentColor || design.colors?.primary || "#D4A5A5",
      }}
      brand={{
        type: qrConfig.brand?.type || "instagram",
        text: qrConfig.brand?.text,
        logoUrl: qrConfig.brand?.logoUrl,
        instagramHandle: qrConfig.brand?.instagramHandle || "@momentounico_invitaciones",
      }}
      primaryColor={design.colors?.primary || "#D4A5A5"}
    />
  )
}
