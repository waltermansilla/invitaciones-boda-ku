import type { Metadata } from "next"
import { getClientConfig, getAllClientParams } from "@/lib/get-client-config"
import { ConfigProvider } from "@/lib/config-context"
import WeddingInvitation from "@/components/wedding/wedding-invitation"

interface PageProps {
  params: Promise<{ tipo: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tipo, slug } = await params
  const config = getClientConfig(tipo, slug)
  return {
    title: config.meta.title,
    description: config.meta.description,
  }
}

export function generateStaticParams() {
  return getAllClientParams()
}

export default async function ClientPage({ params }: PageProps) {
  const { tipo, slug } = await params
  const config = getClientConfig(tipo, slug)

  return (
    <ConfigProvider config={config}>
      <WeddingInvitation />
    </ConfigProvider>
  )
}
