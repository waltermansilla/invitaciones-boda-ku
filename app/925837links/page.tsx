import { listInvitationsForInternalAdmin } from "@/lib/internal-links-admin"
import { InternalLinksList } from "@/components/admin/internal-links-list"

export const dynamic = "force-dynamic"

function absoluteUrl(pathname: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://momentounico.com.ar").replace(
    /\/+$/,
    "",
  )
  return `${base}${pathname}`
}

export default async function InternalLinksAdminPage() {
  const rows = await listInvitationsForInternalAdmin()
  const baseUrl = absoluteUrl("")

  return (
    <main className="min-h-screen bg-[#EEE3D2] text-[#3F332B]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 rounded-2xl border border-[#CFB79A] bg-white p-5 shadow-[0_8px_24px_rgba(71,45,22,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A5F45]">
            Admin interno
          </p>
          <h1 className="mt-2 text-xl font-semibold">Links reales de invitaciones</h1>
          <p className="mt-2 text-sm text-[#6A5C52]">
            Vista rápida para abrir muestra, real base y real con token (si está cargado en JSON).
          </p>
        </header>

        <InternalLinksList rows={rows} baseUrl={baseUrl} />
      </div>
    </main>
  )
}

