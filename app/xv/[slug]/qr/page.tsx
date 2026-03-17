import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import QRCardXV from "@/components/wedding/qr-card-xv"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function QRPage({ params }: PageProps) {
  const { slug } = await params
  
  // Load client JSON
  const filePath = path.join(process.cwd(), "data", "clientes", "xv", `${slug}.json`)
  
  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
  
  // Get QR config from JSON (or use defaults)
  const qrConfig = data.qrCard || {}
  const meta = data.meta || {}
  const design = data.design || {}
  
  // Check if QR page is enabled (default: true)
  if (qrConfig.enabled === false) {
    notFound()
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
