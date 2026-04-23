import { notFound } from "next/navigation"
import QRCard from "@/components/wedding/qr-card"
import QRCardXV from "@/components/wedding/qr-card-xv"
import {
  getAllClientParams,
  getClientConfig,
  isAccessTokenValid,
  type ClientConfig,
} from "@/lib/get-client-config"

interface PageProps {
  params: Promise<{ tipo: string; slug: string }>
  searchParams: Promise<{ t?: string; k?: string }>
}

function BlankPage() {
  return <div style={{ width: "100vw", height: "100dvh", backgroundColor: "#fff" }} />
}

export function generateStaticParams() {
  return getAllClientParams()
}

export default async function QRPage({ params, searchParams }: PageProps) {
  const { tipo, slug } = await params
  const { t, k } = await searchParams
  const token = t || k

  let data: ClientConfig
  try {
    data = getClientConfig(tipo, slug)
  } catch {
    notFound()
  }
  if (!isAccessTokenValid(data, token)) notFound()

  const qrRaw = data.qrCard as Record<string, unknown> | undefined
  const meta = data.meta
  const design = (data.design || {}) as { colors?: { primary?: string } }
  const couple = meta.coupleNames as { brideName?: string; groomName?: string } | undefined

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://momentounico.com.ar"
  const invitationUrlBase =
    (typeof qrRaw?.qrUrl === "string" && qrRaw.qrUrl) || `${baseUrl}/${tipo}/${slug}`
  const invitationUrl =
    token && /^[A-Za-z0-9]{6}$/.test(token)
      ? `${invitationUrlBase}${invitationUrlBase.includes("?") ? "&" : "?"}t=${token}`
      : invitationUrlBase

  if (tipo === "xv") {
    if (!data.qrCard || qrRaw?.enabled === false) {
      return <BlankPage />
    }
    const xv = qrRaw
    const names = (xv.names || {}) as Record<string, string | undefined>
    return (
      <QRCardXV
        names={{
          text1: names.text1 || "Mis XV",
          text2: names.text2 || (meta.quinceaneraName as string) || "Valentina",
          font1: names.font1 || "'Cormorant Garamond', serif",
          font2: names.font2 || "'Great Vibes', cursive",
        }}
        icon={(xv.icon as string) || "sparkles"}
        title={(xv.title as string) || "Comparti tus fotos"}
        description={
          (xv.description as string) ||
          "Subi tus fotos de la fiesta y ayudame a guardar los recuerdos de este dia tan especial"
        }
        qrUrl={invitationUrl}
        qrStyle={{
          fgColor: ((xv.qrStyle as Record<string, string>) || {}).fgColor || "#3D3D3D",
          bgColor: ((xv.qrStyle as Record<string, string>) || {}).bgColor || "transparent",
          cornerStyle: ((xv.qrStyle as Record<string, string>) || {}).cornerStyle || "rounded",
        }}
        cardStyle={{
          bgColor: ((xv.cardStyle as Record<string, string>) || {}).bgColor || "#FDF8F3",
          textColor: ((xv.cardStyle as Record<string, string>) || {}).textColor || "#3D3D3D",
          accentColor:
            ((xv.cardStyle as Record<string, string>) || {}).accentColor ||
            design.colors?.primary ||
            "#D4A5A5",
        }}
        brand={{
          type: (((xv.brand as Record<string, unknown>) || {}).type as "instagram") || "instagram",
          text: (xv.brand as Record<string, string>)?.text,
          logoUrl: (xv.brand as Record<string, string>)?.logoUrl,
          instagramHandle:
            (xv.brand as Record<string, string>)?.instagramHandle ||
            "@momentounico_invitaciones",
        }}
        primaryColor={design.colors?.primary || "#D4A5A5"}
      />
    )
  }

  if (qrRaw?.enabled === false) {
    notFound()
  }

  const names = (qrRaw?.names || {}) as Record<string, string | undefined>
  const qrStyle = (qrRaw?.qrStyle || {}) as Record<string, string>
  const cardStyle = (qrRaw?.cardStyle || {}) as Record<string, string>
  const brand = (qrRaw?.brand || {}) as Record<string, string>

  return (
    <QRCard
      names={{
        name1: names.name1 || couple?.brideName || "Novia",
        name2: names.name2 || couple?.groomName || "Novio",
        font: names.font,
      }}
      icon={(qrRaw?.icon as string) || "camera"}
      title={(qrRaw?.title as string) || "Compartí tus fotos"}
      description={
        (qrRaw?.description as string) ||
        "Subí tus fotos de la fiesta y ayudanos a guardar los recuerdos de este momento tan especial"
      }
      qrUrl={invitationUrl}
      qrStyle={{
        fgColor: qrStyle.fgColor || "#3D3D3D",
        bgColor: qrStyle.bgColor || "transparent",
      }}
      cardStyle={{
        bgColor: cardStyle.bgColor,
        textColor: cardStyle.textColor,
        accentColor: cardStyle.accentColor || design.colors?.primary,
        leafColor: cardStyle.leafColor,
      }}
      brand={{
        type: (brand.type as "instagram") || "instagram",
        text: brand.text,
        logoUrl: brand.logoUrl,
        instagramHandle: brand.instagramHandle || "@momentounico_invitaciones",
      }}
      primaryColor={design.colors?.primary || "#8B7355"}
      variant={(qrRaw?.variant as "classic" | "romantic" | "minimal") || "classic"}
    />
  )
}
