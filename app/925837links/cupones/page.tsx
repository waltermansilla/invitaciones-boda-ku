import { CouponsAdminPanel } from "@/components/admin/coupons-admin-panel"
import { InternalLinksAdminChrome } from "@/components/admin/internal-links-admin-chrome"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

async function getRequestBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host")
  const proto = h.get("x-forwarded-proto") || "http"
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || "https://momentounico.com.ar"
}

export default async function CuponesAdminPage() {
  const requestBaseUrl = await getRequestBaseUrl()
  const baseUrl = requestBaseUrl.replace(/\/+$/, "")

  return (
    <>
      <InternalLinksAdminChrome productionOrigin={baseUrl} />
      <main className="min-h-screen bg-[#F3EBE0] text-[#2F261F]">
        <div className="mx-auto max-w-lg px-4 pb-6 pt-6 sm:pt-8">
          <CouponsAdminPanel />
        </div>
      </main>
    </>
  )
}
