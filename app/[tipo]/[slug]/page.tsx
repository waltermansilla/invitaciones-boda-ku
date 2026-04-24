import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import {
  getClientConfig,
  getAllClientParams,
  isAccessTokenValid,
} from "@/lib/get-client-config"
import { ConfigProvider } from "@/lib/config-context"
import WeddingInvitation from "@/components/wedding/wedding-invitation"

interface PageProps {
  params: Promise<{ tipo: string; slug: string }>
  searchParams: Promise<{ t?: string; k?: string; v?: string }>
}

function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://momentounico.com.ar").replace(/\/+$/, "")
}

function getRequestSiteUrl() {
  const h = headers()
  const host = h.get("x-forwarded-host") || h.get("host")
  const proto = h.get("x-forwarded-proto") || "https"
  if (!host) return getPublicSiteUrl()
  return `${proto}://${host}`.replace(/\/+$/, "")
}

function resolveOgImage(config: ReturnType<typeof getClientConfig>) {
  const metaImage =
    typeof config.meta?.ogImage === "string"
      ? config.meta.ogImage
      : typeof config.meta?.image === "string"
        ? config.meta.image
        : null
  const heroImage =
    typeof config.hero?.coupleImage === "string" ? config.hero.coupleImage : null
  const image = metaImage || heroImage
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image
  return `${getRequestSiteUrl()}${image.startsWith("/") ? image : `/${image}`}`
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { tipo, slug } = await params
  const { v } = await searchParams
  const config = getClientConfig(tipo, slug, v)
  const siteUrl = getRequestSiteUrl()
  const canonicalUrl = `${siteUrl}/${tipo}/${slug}`
  const ogImage = resolveOgImage(config)

  return {
    title: config.meta.title,
    description: config.meta.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.meta.title,
      description: config.meta.description,
      url: canonicalUrl,
      type: "website",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: config.meta.title,
      description: config.meta.description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export function generateStaticParams() {
  return getAllClientParams()
}

export default async function ClientPage({ params, searchParams }: PageProps) {
  const { tipo, slug } = await params
  const { t, k, v } = await searchParams
  const token = t || k
  const config = getClientConfig(tipo, slug, v)
  if (!isAccessTokenValid(config, token)) notFound()

  return (
    <ConfigProvider config={config}>
      <Suspense fallback={null}>
        <WeddingInvitation />
      </Suspense>
    </ConfigProvider>
  )
}
