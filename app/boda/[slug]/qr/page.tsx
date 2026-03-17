import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import QRCard from "@/components/wedding/qr-card"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function QRPage({ params }: PageProps) {
  const { slug } = await params
  
  // Load client JSON
  const filePath = path.join(process.cwd(), "data", "clientes", "boda", `${slug}.json`)
  
  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
  
  // Get QR config from JSON (or use defaults)
  const qrConfig = data.qrCard || {}
  const meta = data.meta || {}
  const design = data.design || {}
  
  // Build invitation URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://momentounico.com.ar"
  const invitationUrl = qrConfig.qrUrl || `${baseUrl}/boda/${slug}`

  return (
    <QRCard
      names={{
        name1: qrConfig.names?.name1 || meta.coupleNames?.brideName || "Novia",
        name2: qrConfig.names?.name2 || meta.coupleNames?.groomName || "Novio",
        separator: qrConfig.names?.separator || "heart",
        font: qrConfig.names?.font || "'Great Vibes', cursive",
      }}
      icon={qrConfig.icon || "camera"}
      title={qrConfig.title || "Compartí tus fotos"}
      description={qrConfig.description || "Subí tus fotos de la fiesta y ayudanos a guardar los recuerdos de este momento tan especial"}
      qrUrl={invitationUrl}
      qrStyle={{
        fgColor: qrConfig.qrStyle?.fgColor || "#3D3D3D",
        bgColor: qrConfig.qrStyle?.bgColor || "transparent",
        cornerStyle: qrConfig.qrStyle?.cornerStyle || "rounded",
      }}
      cardStyle={{
        bgColor: qrConfig.cardStyle?.bgColor || "#F8F4EE",
        textColor: qrConfig.cardStyle?.textColor || "#4A4A4A",
        accentColor: qrConfig.cardStyle?.accentColor || design.colors?.primary || "#8B7355",
        leafColor: qrConfig.cardStyle?.leafColor || "#9CAF88",
      }}
      brand={{
        type: qrConfig.brand?.type || "instagram",
        text: qrConfig.brand?.text,
        logoUrl: qrConfig.brand?.logoUrl,
        instagramHandle: qrConfig.brand?.instagramHandle || "@momentounico_invitaciones",
      }}
      primaryColor={design.colors?.primary || "#8B7355"}
    />
  )
}
