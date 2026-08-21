import { createApiClient } from "@/lib/supabase/api"
import type {
  MesaAsientoRecord,
  MesaRecord,
  MesasPlanPayload,
} from "./types"

type MesaRow = {
  id: string
  numero: number
  nombre: string | null
  capacidad: number
  orden: number
  pos_x: number
  pos_y: number
}

type AsientoRow = {
  mesa_id: string
  seat_key: string
  orden: number
}

function clampPos(n: number): number {
  if (!Number.isFinite(n)) return 50
  return Math.min(100, Math.max(0, n))
}

function normalizeMesaInput(raw: unknown, index: number): MesaRecord | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === "string" ? o.id.trim() : ""
  if (!id) return null
  const numero =
    typeof o.numero === "number" && Number.isFinite(o.numero)
      ? Math.max(1, Math.floor(o.numero))
      : index + 1
  const nombre = typeof o.nombre === "string" ? o.nombre.trim() : ""
  const capacidadRaw =
    typeof o.capacidad === "number" && Number.isFinite(o.capacidad)
      ? Math.floor(o.capacidad)
      : 10
  const capacidad = Math.min(50, Math.max(1, capacidadRaw))
  const orden =
    typeof o.orden === "number" && Number.isFinite(o.orden)
      ? Math.floor(o.orden)
      : index
  const posX = clampPos(
    typeof o.posX === "number"
      ? o.posX
      : typeof o.pos_x === "number"
        ? o.pos_x
        : 50,
  )
  const posY = clampPos(
    typeof o.posY === "number"
      ? o.posY
      : typeof o.pos_y === "number"
        ? o.pos_y
        : 50,
  )
  return { id, numero, nombre, capacidad, orden, posX, posY }
}

function normalizeAsientoInput(raw: unknown): MesaAsientoRecord | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const mesaId = typeof o.mesaId === "string" ? o.mesaId.trim() : ""
  const seatKey = typeof o.seatKey === "string" ? o.seatKey.trim() : ""
  if (!mesaId || !seatKey) return null
  if (!seatKey.startsWith("integrante:") && !seatKey.startsWith("invitado:")) {
    return null
  }
  const orden =
    typeof o.orden === "number" && Number.isFinite(o.orden)
      ? Math.floor(o.orden)
      : 0
  return { mesaId, seatKey, orden }
}

export function parseMesasPlanBody(body: unknown): MesasPlanPayload | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const mesasRaw = Array.isArray(o.mesas) ? o.mesas : null
  const asientosRaw = Array.isArray(o.asientos) ? o.asientos : null
  if (!mesasRaw || !asientosRaw) return null

  const mesas: MesaRecord[] = []
  const mesaIds = new Set<string>()
  const numeros = new Set<number>()
  mesasRaw.forEach((item, i) => {
    const m = normalizeMesaInput(item, i)
    if (!m) return
    if (mesaIds.has(m.id) || numeros.has(m.numero)) return
    mesaIds.add(m.id)
    numeros.add(m.numero)
    mesas.push(m)
  })

  const asientos: MesaAsientoRecord[] = []
  const seenSeats = new Set<string>()
  for (const item of asientosRaw) {
    const a = normalizeAsientoInput(item)
    if (!a) continue
    if (!mesaIds.has(a.mesaId)) continue
    if (seenSeats.has(a.seatKey)) continue
    seenSeats.add(a.seatKey)
    asientos.push(a)
  }

  return { mesas, asientos }
}

export async function loadMesasPlan(
  eventoId: string,
): Promise<MesasPlanPayload> {
  const supabase = createApiClient()
  const { data: mesasRows, error: mesasErr } = await supabase
    .from("mesas")
    .select("id, numero, nombre, capacidad, orden, pos_x, pos_y")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: true })
    .order("numero", { ascending: true })

  if (mesasErr) {
    if (isMissingTableError(mesasErr.message)) {
      return { mesas: [], asientos: [] }
    }
    throw new Error(mesasErr.message)
  }

  const { data: asientosRows, error: asientosErr } = await supabase
    .from("mesa_asientos")
    .select("mesa_id, seat_key, orden")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: true })

  if (asientosErr) {
    if (isMissingTableError(asientosErr.message)) {
      return { mesas: [], asientos: [] }
    }
    throw new Error(asientosErr.message)
  }

  const mesas: MesaRecord[] = ((mesasRows || []) as MesaRow[]).map((r) => ({
    id: r.id,
    numero: r.numero,
    nombre: r.nombre || "",
    capacidad: r.capacidad,
    orden: r.orden,
    posX: clampPos(Number(r.pos_x)),
    posY: clampPos(Number(r.pos_y)),
  }))

  const asientos: MesaAsientoRecord[] = (
    (asientosRows || []) as AsientoRow[]
  ).map((r) => ({
    mesaId: r.mesa_id,
    seatKey: r.seat_key,
    orden: r.orden,
  }))

  return { mesas, asientos }
}

function isMissingTableError(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    (m.includes("relation") && m.includes("mesas"))
  )
}

/**
 * Reemplazo completo del plan: una sola escritura al Guardar.
 * Borra mesas/asientos del evento e inserta el payload.
 */
export async function saveMesasPlan(
  eventoId: string,
  plan: MesasPlanPayload,
): Promise<MesasPlanPayload> {
  const supabase = createApiClient()

  const { error: delAsientosErr } = await supabase
    .from("mesa_asientos")
    .delete()
    .eq("evento_id", eventoId)
  if (delAsientosErr) {
    throw new Error(
      isMissingTableError(delAsientosErr.message)
        ? "Falta correr el script SQL 010_mesas.sql en Supabase."
        : delAsientosErr.message,
    )
  }

  const { error: delMesasErr } = await supabase
    .from("mesas")
    .delete()
    .eq("evento_id", eventoId)
  if (delMesasErr) throw new Error(delMesasErr.message)

  if (plan.mesas.length > 0) {
    const rows = plan.mesas.map((m) => ({
      id: m.id,
      evento_id: eventoId,
      numero: m.numero,
      nombre: m.nombre || "",
      capacidad: m.capacidad,
      orden: m.orden,
      pos_x: m.posX,
      pos_y: m.posY,
    }))
    const { error: insMesasErr } = await supabase.from("mesas").insert(rows)
    if (insMesasErr) throw new Error(insMesasErr.message)
  }

  if (plan.asientos.length > 0) {
    const rows = plan.asientos.map((a) => ({
      evento_id: eventoId,
      mesa_id: a.mesaId,
      seat_key: a.seatKey,
      orden: a.orden,
    }))
    const { error: insAsientosErr } = await supabase
      .from("mesa_asientos")
      .insert(rows)
    if (insAsientosErr) throw new Error(insAsientosErr.message)
  }

  return loadMesasPlan(eventoId)
}
