import { createServiceClient } from "@/lib/supabase/service"
import {
  DEFAULT_SERIES_MESSAGES,
} from "@/lib/coupons/message"
import { promises as fs } from "fs"
import path from "path"

const MESSAGES_JSON = path.join(
  process.cwd(),
  "data/internal/coupon-series-messages.json",
)

async function readMessagesFile(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(MESSAGES_JSON, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

async function writeMessagesFile(map: Record<string, string>): Promise<void> {
  await fs.mkdir(path.dirname(MESSAGES_JSON), { recursive: true })
  await fs.writeFile(
    MESSAGES_JSON,
    `${JSON.stringify(map, null, 2)}\n`,
    "utf8",
  )
}

async function readMessagesFromDb(): Promise<Record<string, string> | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("coupon_series_meta")
      .select("categoria, mensaje_email")
    if (error) return null
    const out: Record<string, string> = {}
    for (const row of data ?? []) {
      const cat = String((row as { categoria?: string }).categoria ?? "").trim()
      const msg = (row as { mensaje_email?: string }).mensaje_email
      if (cat && typeof msg === "string") out[cat] = msg
    }
    return out
  } catch {
    return null
  }
}

export async function listSeriesMessages(): Promise<Record<string, string>> {
  const fromDb = await readMessagesFromDb()
  const fromFile = await readMessagesFile()
  return {
    ...DEFAULT_SERIES_MESSAGES,
    ...fromFile,
    ...(fromDb ?? {}),
  }
}

export async function getSeriesMessage(categoria: string): Promise<string> {
  const cat = categoria.trim()
  const all = await listSeriesMessages()
  return all[cat] ?? ""
}

export async function setSeriesMessage(
  categoria: string,
  mensaje: string,
): Promise<{ storedIn: "db" | "file" }> {
  const cat = categoria.trim()
  if (!cat) throw new Error("Falta categoría.")

  let storedIn: "db" | "file" = "file"
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from("coupon_series_meta").upsert(
      {
        categoria: cat,
        mensaje_email: mensaje,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "categoria" },
    )
    if (!error) {
      storedIn = "db"
    }
  } catch {
    // tabla aún no creada
  }

  const map = await readMessagesFile()
  map[cat] = mensaje
  try {
    await writeMessagesFile(map)
  } catch (err) {
    if (storedIn !== "db") {
      throw new Error(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el mensaje. Corré scripts/006_coupon_series_meta.sql en Supabase.",
      )
    }
  }

  return { storedIn }
}
