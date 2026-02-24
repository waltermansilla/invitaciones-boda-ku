import Link from "next/link"
import { getAllClientParams } from "@/lib/get-client-config"

/**
 * Root page -- lists all available client invitations.
 * Each client gets a link to their dynamic route.
 * In production, you could replace this with a branded landing page.
 */
export default function Page() {
  const clients = getAllClientParams()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16">
      <h1 className="mb-2 text-center text-2xl font-light tracking-wide text-foreground">
        Invitaciones
      </h1>
      <p className="mb-10 text-center text-sm text-muted-foreground">
        Selecciona una invitacion para previsualizarla
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {clients.map(({ tipo, slug }) => (
          <Link
            key={`${tipo}/${slug}`}
            href={`/${tipo}/${slug}`}
            className="flex min-h-[44px] items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span className="capitalize">{slug.replace(/-/g, " ")}</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
              {tipo}
            </span>
          </Link>
        ))}

        {clients.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No hay invitaciones todavia. Agrega un JSON en data/clientes/
          </p>
        )}
      </div>
    </main>
  )
}
