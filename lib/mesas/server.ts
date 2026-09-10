import { createApiClient } from "@/lib/supabase/api"
import type {
  MesaAsientoRecord,
  MesaRecord,
  MesasPlanPayload,
} from "./types"
import { normalizeMesaForma, normalizeMesaTipo } from "./types"
import { scaleMaxFor } from "./layout"

type MesaRow = {
  id: string
  numero: number
  nombre: string | null
  capacidad: number
  orden: number
  pos_x: number
  pos_y: number
  forma?: string | null
  tipo?: string | null
  extra?: unknown
}

type AsientoRow = {
  mesa_id: string
  seat_key: string
  orden: number
}

function clampPos(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, value))
}

function parseExtra(raw: unknown): {
  rotacion?: number
  escalaY?: number
  sillasFijas?: number
  chairPts?: { x: number; y: number }[]
  capacidad?: number
} {
  if (!raw || typeof raw !== "object") return {}
  const o = raw as Record<string, unknown>
  const extra: {
    rotacion?: number
    escalaY?: number
    sillasFijas?: number
    chairPts?: { x: number; y: number }[]
    capacidad?: number
  } = {}
  if (typeof o.rotacion === "number" && Number.isFinite(o.rotacion)) {
    extra.rotacion = o.rotacion
  }
  if (typeof o.escalaY === "number" && Number.isFinite(o.escalaY)) {
    extra.escalaY = o.escalaY
  }
  if (typeof o.sillasFijas === "number" && Number.isFinite(o.sillasFijas)) {
    extra.sillasFijas = o.sillasFijas
  }
  if (typeof o.capacidad === "number" && Number.isFinite(o.capacidad)) {
    extra.capacidad = o.capacidad
  }
  if (Array.isArray(o.chairPts)) {
    extra.chairPts = o.chairPts
      .filter(
        (p): p is { x: number; y: number } =>
          Boolean(p) &&
          typeof p === "object" &&
          typeof (p as { x: unknown }).x === "number" &&
          typeof (p as { y: unknown }).y === "number",
      )
      .map((p) => ({ x: p.x, y: p.y }))
  }
  return extra
}

function extraPayload(m: MesaRecord) {
  return {
    rotacion: m.rotacion ?? 0,
    capacidad: m.capacidad,
    escalaY: m.escalaY ?? m.capacidad,
    sillasFijas: m.sillasFijas ?? null,
    chairPts: m.chairPts ?? [],
  }
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
  const forma = normalizeMesaForma(o.forma)
  const tipo = normalizeMesaTipo(o.tipo)
  const extra = parseExtra(o.extra ?? o)
  const max = scaleMaxFor(tipo, forma)
  const capacidadRaw =
    typeof o.capacidad === "number" && Number.isFinite(o.capacidad)
      ? o.capacidad
      : typeof extra.capacidad === "number"
        ? extra.capacidad
        : 4
  const capacidad = Math.min(max, Math.max(0, capacidadRaw))
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
  return {
    id,
    numero,
    nombre,
    orden,
    posX,
    posY,
    forma,
    tipo,
    ...extra,
    capacidad,
    escalaY:
      typeof extra.escalaY === "number"
        ? Math.min(max, Math.max(0, extra.escalaY))
        : extra.escalaY,
  }
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

function mesaSelect(withTipo: boolean, withForma: boolean, withExtra = false): string {
  const cols = ["id", "numero", "nombre", "capacidad", "orden", "pos_x", "pos_y"]
  if (withForma) cols.push("forma")
  if (withTipo) cols.push("tipo")
  if (withExtra) cols.push("extra")
  return cols.join(", ")
}

export async function loadMesasPlan(
  eventoId: string,
): Promise<MesasPlanPayload> {
  const supabase = createApiClient()
  let mesasQuery = await supabase
    .from("mesas")
    .select(mesaSelect(true, true, true))
    .eq("evento_id", eventoId)
    .order("orden", { ascending: true })
    .order("numero", { ascending: true })

  if (mesasQuery.error) {
    const msg = mesasQuery.error.message
    if (
      isMissingColumnError(msg, "tipo") ||
      isMissingColumnError(msg, "forma") ||
      isMissingColumnError(msg, "extra")
    ) {
      const withTipo = !isMissingColumnError(msg, "tipo")
      const withForma = !isMissingColumnError(msg, "forma")
      const withExtra = !isMissingColumnError(msg, "extra")
      mesasQuery = await supabase
        .from("mesas")
        .select(mesaSelect(withTipo, withForma, withExtra))
        .eq("evento_id", eventoId)
        .order("orden", { ascending: true })
        .order("numero", { ascending: true })
    }
  }

  const { data: mesasRows, error: mesasErr } = mesasQuery

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

  const mesas: MesaRecord[] = ((mesasRows || []) as MesaRow[]).map((r) => {
    const forma = normalizeMesaForma(r.forma)
    const tipo = normalizeMesaTipo(r.tipo)
    const extra = parseExtra(r.extra)
    const max = scaleMaxFor(tipo, forma)
    const capRaw =
      typeof extra.capacidad === "number" ? extra.capacidad : r.capacidad
    return {
      id: r.id,
      numero: r.numero,
      nombre: r.nombre || "",
      orden: r.orden,
      posX: clampPos(Number(r.pos_x)),
      posY: clampPos(Number(r.pos_y)),
      forma,
      tipo,
      ...extra,
      capacidad: Math.min(max, Math.max(0, Number(capRaw))),
      escalaY:
        typeof extra.escalaY === "number"
          ? Math.min(max, Math.max(0, extra.escalaY))
          : extra.escalaY,
    }
  })

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

function isMissingColumnError(msg: string, col: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes(col) &&
    (m.includes("column") || m.includes("schema cache") || m.includes("does not exist"))
  )
}

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
    const full = plan.mesas.map((m) => ({
      id: m.id,
      evento_id: eventoId,
      numero: m.numero,
      nombre: m.nombre || "",
      capacidad: Math.round(m.capacidad),
      orden: m.orden,
      pos_x: m.posX,
      pos_y: m.posY,
      forma: normalizeMesaForma(m.forma),
      tipo: normalizeMesaTipo(m.tipo),
      extra: extraPayload(m),
    }))
    let ins = await supabase.from("mesas").insert(full)
    if (ins.error && isMissingColumnError(ins.error.message, "extra")) {
      const noExtra = full.map(({ extra: _e, ...rest }) => rest)
      ins = await supabase.from("mesas").insert(noExtra)
    }
    if (ins.error && isMissingColumnError(ins.error.message, "tipo")) {
      const noTipo = full.map(({ tipo: _t, ...rest }) => rest)
      ins = await supabase.from("mesas").insert(noTipo)
    }
    if (ins.error && isMissingColumnError(ins.error.message, "forma")) {
      const noForma = full.map(({ forma: _f, tipo: _t, ...rest }) => rest)
      ins = await supabase.from("mesas").insert(noForma)
    }
    if (ins.error) throw new Error(ins.error.message)
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
