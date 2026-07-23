import { createServiceClient } from "@/lib/supabase/service"
import { promises as fs } from "fs"
import path from "path"

export type SeriesOrderUsageMode = "single_use" | "unlimited"

const ORDER_JSON = path.join(
  process.cwd(),
  "data/internal/coupon-series-order.json",
)

type OrderFile = {
  single_use?: string[]
  unlimited?: string[]
}

async function readOrderFile(): Promise<OrderFile> {
  try {
    const raw = await fs.readFile(ORDER_JSON, "utf8")
    return JSON.parse(raw) as OrderFile
  } catch {
    return {}
  }
}

async function writeOrderFile(data: OrderFile): Promise<void> {
  await fs.mkdir(path.dirname(ORDER_JSON), { recursive: true })
  await fs.writeFile(ORDER_JSON, `${JSON.stringify(data, null, 2)}\n`, "utf8")
}

async function readOrderFromDb(): Promise<Record<string, number> | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("coupon_series_meta")
      .select("categoria, orden")
    if (error) return null
    const out: Record<string, number> = {}
    for (const row of data ?? []) {
      const cat = String((row as { categoria?: string }).categoria ?? "").trim()
      const orden = Number((row as { orden?: number }).orden)
      if (cat) out[cat] = Number.isFinite(orden) ? orden : 0
    }
    return out
  } catch {
    return null
  }
}

/** Mapa categoria → orden (menor = primero). */
export async function listSeriesOrders(): Promise<Record<string, number>> {
  const fromDb = await readOrderFromDb()
  if (fromDb) return fromDb

  const file = await readOrderFile()
  const out: Record<string, number> = {}
  for (const mode of ["single_use", "unlimited"] as const) {
    const ids = file[mode] ?? []
    ids.forEach((id, i) => {
      out[id] = i
    })
  }
  return out
}

export function sortCategoriesByOrder<
  T extends { id: string; label: string; usageMode: string },
>(categories: T[], orders: Record<string, number>): T[] {
  return [...categories].sort((a, b) => {
    if (a.usageMode !== b.usageMode) {
      return a.usageMode === "single_use" ? -1 : 1
    }
    const oa = orders[a.id]
    const ob = orders[b.id]
    const hasA = oa != null
    const hasB = ob != null
    if (hasA && hasB && oa !== ob) return oa - ob
    if (hasA && !hasB) return -1
    if (!hasA && hasB) return 1
    return a.label.localeCompare(b.label, "es")
  })
}

/** Guarda el orden de una lista de categorías (mismo tipo). */
export async function setSeriesOrder(
  usageMode: SeriesOrderUsageMode,
  orderedIds: string[],
): Promise<{ storedIn: "db" | "file" }> {
  const ids = orderedIds.map((id) => id.trim()).filter(Boolean)
  if (ids.length === 0) throw new Error("Falta la lista de series.")

  let storedIn: "db" | "file" = "file"
  try {
    const supabase = createServiceClient()
    const rows = ids.map((categoria, orden) => ({
      categoria,
      orden,
      updated_at: new Date().toISOString(),
    }))
    // Upsert sin pisar mensaje_email: leer actuales y merge
    const { data: existing } = await supabase
      .from("coupon_series_meta")
      .select("categoria, mensaje_email")
      .in("categoria", ids)
    const msgByCat = new Map<string, string>()
    for (const row of existing ?? []) {
      const cat = String((row as { categoria?: string }).categoria ?? "")
      const msg = (row as { mensaje_email?: string | null }).mensaje_email
      if (cat) msgByCat.set(cat, typeof msg === "string" ? msg : "")
    }
    const upserts = rows.map((r) => ({
      ...r,
      mensaje_email: msgByCat.get(r.categoria) ?? "",
    }))
    const { error } = await supabase
      .from("coupon_series_meta")
      .upsert(upserts, { onConflict: "categoria" })
    if (!error) storedIn = "db"
  } catch {
    // tabla / columna aún no lista
  }

  const file = await readOrderFile()
  file[usageMode] = ids
  try {
    await writeOrderFile(file)
  } catch (err) {
    if (storedIn !== "db") {
      throw new Error(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el orden. Corré scripts/008_coupon_series_orden.sql en Supabase.",
      )
    }
  }

  return { storedIn }
}
