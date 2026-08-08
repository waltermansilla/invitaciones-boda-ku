import { createServiceClient } from "@/lib/supabase/service"
import {
  getAuthorizedPanelConfig,
  panelIdsForEventLookup,
  canonicalPanelIdFromConfig,
} from "@/lib/config-loader"
import {
  formatReferralCode,
  todayArgentinaYmd,
  addDaysArgentina,
} from "@/lib/referrals/prefix"
import { normalizeCouponCode } from "@/lib/coupons/logic"
import type { CuponRow } from "@/lib/coupons/types"

export const REFERRAL_CATEGORY = "referido"
export const REFERRAL_DEFAULT_DISCOUNT = 25
export const REFERRAL_DEFAULT_VALIDITY_DAYS = 30

export type ActivateReferralInput = {
  panelId: string
  guestCodigo: string
  codePrefix: string
  /** Etiqueta para admin (ej. "Sofía & Mateo"). */
  eventLabel?: string
  discountPercent?: number
  validityDays?: number
}

export type ActivateReferralResult = {
  code: string
  validoHasta: string
  isNew: boolean
  discountPercent: number
  panelId: string
  eventLabel: string | null
  guestCodigo: string
}

type ReferralRow = CuponRow & {
  evento_label?: string | null
  invitado_codigo?: string | null
  panel_id?: string | null
  activado_at?: string | null
}

function errMessage(err: unknown): string {
  if (!err) return "Error desconocido"
  if (err instanceof Error && err.message) return err.message
  if (typeof err === "object" && err !== null) {
    const o = err as {
      message?: string
      error?: string
      details?: string
      hint?: string
      code?: string
    }
    const parts = [o.message, o.error, o.details, o.hint, o.code].filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    )
    if (parts.length) return parts.join(" · ")
  }
  return String(err)
}

function isMissingColumnError(err: unknown): boolean {
  const msg = errMessage(err).toLowerCase()
  return (
    msg.includes("panel_id") ||
    msg.includes("invitado_codigo") ||
    msg.includes("evento_label") ||
    msg.includes("activado_at") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    msg.includes("pgrst204")
  )
}

function activatedTime(c: ReferralRow): number {
  if (c.activado_at) {
    const t = Date.parse(c.activado_at)
    if (Number.isFinite(t)) return t
  }
  if (c.created_at) {
    const t = Date.parse(c.created_at)
    if (Number.isFinite(t)) return t
  }
  return 0
}

/** Deja un solo cupón por invitado (el más antiguo). Borra el resto si no se usaron. */
async function pruneDuplicateReferrals(
  supabase: ReturnType<typeof createServiceClient>,
  rows: ReferralRow[],
): Promise<ReferralRow> {
  if (rows.length === 1) return rows[0]
  const sorted = [...rows].sort((a, b) => {
    // Preferir usados: no borrar el que ya se usó
    if (a.usado && !b.usado) return -1
    if (!a.usado && b.usado) return 1
    return activatedTime(a) - activatedTime(b)
  })
  const keep = sorted[0]
  const dropIds = sorted
    .slice(1)
    .filter((r) => !r.usado && r.id !== keep.id)
    .map((r) => r.id)
  if (dropIds.length > 0) {
    const { error } = await supabase.from("cupones").delete().in("id", dropIds)
    if (error) {
      console.warn("[referral] prune duplicates", errMessage(error))
    }
  }
  return keep
}

/**
 * Busca cupón existente para este invitado (nunca crear 2).
 * Incluye filas con columnas nuevas y fallback `ref:panel:codigo`.
 */
async function findExistingReferral(
  supabase: ReturnType<typeof createServiceClient>,
  panelIds: string[],
  guestCodigo: string,
): Promise<ReferralRow | null> {
  const found: ReferralRow[] = []
  const seen = new Set<string>()

  const pushRows = (list: ReferralRow[] | null | undefined) => {
    for (const row of list ?? []) {
      if (!row?.id || seen.has(row.id)) continue
      seen.add(row.id)
      found.push(row)
    }
  }

  // 1) invitado_codigo + panel (canon / legacy)
  {
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .eq("categoria", REFERRAL_CATEGORY)
      .eq("invitado_codigo", guestCodigo)
      .in("panel_id", panelIds)
    if (!error && data?.length) pushRows(data as ReferralRow[])
  }

  // 2) invitado_codigo solo (por si panel_id quedó vacío o viejo)
  if (found.length === 0) {
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .eq("categoria", REFERRAL_CATEGORY)
      .eq("invitado_codigo", guestCodigo)
    if (!error && data?.length) pushRows(data as ReferralRow[])
  }

  // 3) Fallback legacy en usado_nombre
  if (found.length === 0) {
    for (const panelId of panelIds) {
      const marker = `ref:${panelId}:${guestCodigo}`
      const { data, error } = await supabase
        .from("cupones")
        .select("*")
        .eq("categoria", REFERRAL_CATEGORY)
        .ilike("usado_nombre", `${marker}%`)
        .limit(5)
      if (!error && data?.length) pushRows(data as ReferralRow[])
    }
  }

  if (found.length === 0) return null
  return pruneDuplicateReferrals(supabase, found)
}

async function nextGuestNumber(
  supabase: ReturnType<typeof createServiceClient>,
  prefix: string,
): Promise<number> {
  const p = prefix.replace(/[^a-zA-Z]/g, "").toUpperCase()
  const { data, error } = await supabase
    .from("cupones")
    .select("codigo")
    .eq("categoria", REFERRAL_CATEGORY)
    .ilike("codigo", `${p}%`)
  if (error) throw new Error(errMessage(error))

  let max = 0
  for (const row of data ?? []) {
    const code = String((row as { codigo?: string }).codigo || "")
    const m = code.match(new RegExp(`^${p}(\\d+)$`, "i"))
    if (m) {
      const n = Number(m[1])
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  return max + 1
}

function toResult(
  c: ReferralRow,
  opts: {
    storePanelId: string
    eventLabel: string | null
    guestCodigo: string
    discount: number
    isNew: boolean
  },
): ActivateReferralResult {
  return {
    code: c.codigo,
    validoHasta: c.valido_hasta || todayArgentinaYmd(),
    isNew: opts.isNew,
    discountPercent: Number(c.descuento_porcentaje) || opts.discount,
    panelId: storePanelIdNormalized(c, opts.storePanelId),
    eventLabel: c.evento_label ?? opts.eventLabel,
    guestCodigo: opts.guestCodigo,
  }
}

function storePanelIdNormalized(
  c: ReferralRow,
  fallback: string,
): string {
  return (typeof c.panel_id === "string" && c.panel_id.trim()) || fallback
}

/**
 * Activa o devuelve cupón referido del invitado.
 * Garantía: a lo sumo 1 cupón por (panel, invitado).
 * Primer open = crea; reabrir = mismo código.
 */
export async function activateOrGetReferralCoupon(
  input: ActivateReferralInput,
): Promise<ActivateReferralResult> {
  const panelIdRaw = input.panelId.trim()
  const guestCodigo = input.guestCodigo.trim()
  const prefix = input.codePrefix
    .trim()
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase()
  if (!panelIdRaw || !guestCodigo) {
    throw new Error("Faltan panelId o código de invitado.")
  }
  if (!prefix || prefix.length < 2) {
    throw new Error("Prefijo de cupón inválido.")
  }

  const discount =
    typeof input.discountPercent === "number" && input.discountPercent > 0
      ? Math.min(100, Math.round(input.discountPercent))
      : REFERRAL_DEFAULT_DISCOUNT
  const validityDays =
    typeof input.validityDays === "number" && input.validityDays > 0
      ? Math.round(input.validityDays)
      : REFERRAL_DEFAULT_VALIDITY_DAYS

  const eventConfig = getAuthorizedPanelConfig(panelIdRaw)
  if (!eventConfig?.rsvpPanel?.enabled) {
    throw new Error("Este panel no tiene referidos habilitados.")
  }
  if (eventConfig.rsvpPanel.referidos !== true) {
    throw new Error("Los referidos no están activos en esta invitación.")
  }

  const panelIds = panelIdsForEventLookup(eventConfig)
  const storePanelId = canonicalPanelIdFromConfig(eventConfig) || panelIdRaw
  const eventLabel = input.eventLabel?.trim() || null

  const supabase = createServiceClient()

  const { data: eventos, error: evErr } = await supabase
    .from("eventos")
    .select("id, panel_id")
    .in("panel_id", panelIds)
  if (evErr) throw new Error(`Evento: ${errMessage(evErr)}`)
  if (!eventos?.length) {
    throw new Error(
      `Panel no encontrado en la base (${panelIds.join(" / ")}). ¿Existe el evento en Supabase?`,
    )
  }
  const eventoIds = eventos.map((e) => e.id as string)

  const { data: invitado, error: invErr } = await supabase
    .from("invitados")
    .select("id, codigo, nombre, evento_id")
    .eq("codigo", guestCodigo)
    .in("evento_id", eventoIds)
    .maybeSingle()
  if (invErr) throw new Error(`Invitado: ${errMessage(invErr)}`)
  if (!invitado) {
    throw new Error(
      "No encontramos ese invitado en el panel. Usá el link personal (?i=) copiado del panel.",
    )
  }

  // Ya activado → nunca crear otro
  const existing = await findExistingReferral(
    supabase,
    panelIds,
    guestCodigo,
  )
  if (existing) {
    return toResult(existing, {
      storePanelId,
      eventLabel,
      guestCodigo,
      discount,
      isNew: false,
    })
  }

  let guestNumber = 1
  try {
    guestNumber = await nextGuestNumber(supabase, prefix)
  } catch (e) {
    console.warn("[referral] nextGuestNumber", errMessage(e))
    guestNumber = 1
  }

  let code = formatReferralCode(prefix, guestNumber)
  for (let attempt = 0; attempt < 50; attempt++) {
    const tryCode = formatReferralCode(prefix, guestNumber + attempt)
    const { data: clash, error: clashErr } = await supabase
      .from("cupones")
      .select("id")
      .eq("codigo", tryCode)
      .maybeSingle()
    if (clashErr) {
      code = tryCode
      break
    }
    if (!clash) {
      code = tryCode
      break
    }
  }

  // Re-check por carrera (doble click / 2 pestañas)
  const raceCheck = await findExistingReferral(
    supabase,
    panelIds,
    guestCodigo,
  )
  if (raceCheck) {
    return toResult(raceCheck, {
      storePanelId,
      eventLabel,
      guestCodigo,
      discount,
      isNew: false,
    })
  }

  const today = todayArgentinaYmd()
  const validoHasta = addDaysArgentina(today, validityDays)
  const activadoAt = new Date().toISOString()

  const fullRow = {
    codigo: normalizeCouponCode(code),
    categoria: REFERRAL_CATEGORY,
    descuento_porcentaje: discount,
    valido_hasta: validoHasta,
    activo: true,
    usado: false,
    usado_device: null as string | null,
    usado_tipo_evento: null as string | null,
    usado_nombre: eventLabel,
    usado_at: null as string | null,
    panel_id: storePanelId,
    invitado_codigo: guestCodigo,
    evento_label: eventLabel,
    activado_at: activadoAt,
  }

  {
    const { data: inserted, error: insErr } = await supabase
      .from("cupones")
      .insert(fullRow)
      .select("*")
      .maybeSingle()

    if (!insErr && inserted) {
      // Por si se coló un duplicado en paralelo: dejar uno solo
      const kept = await findExistingReferral(
        supabase,
        panelIds,
        guestCodigo,
      )
      return toResult((kept || inserted) as ReferralRow, {
        storePanelId,
        eventLabel,
        guestCodigo,
        discount,
        isNew: true,
      })
    }

    if (insErr && !isMissingColumnError(insErr)) {
      // Unique race: devolver existente
      const again = await findExistingReferral(
        supabase,
        panelIds,
        guestCodigo,
      )
      if (again) {
        return toResult(again, {
          storePanelId,
          eventLabel,
          guestCodigo,
          discount,
          isNew: false,
        })
      }
      throw new Error(`No se pudo crear el cupón: ${errMessage(insErr)}`)
    }
  }

  // Fallback sin columnas nuevas
  {
    const again = await findExistingReferral(
      supabase,
      panelIds,
      guestCodigo,
    )
    if (again) {
      return toResult(again, {
        storePanelId,
        eventLabel,
        guestCodigo,
        discount,
        isNew: false,
      })
    }

    const { data: fallback, error: fbErr } = await supabase
      .from("cupones")
      .insert({
        codigo: normalizeCouponCode(code),
        categoria: REFERRAL_CATEGORY,
        descuento_porcentaje: discount,
        valido_hasta: validoHasta,
        activo: true,
        usado: false,
        usado_nombre: `ref:${storePanelId}:${guestCodigo}${eventLabel ? `|${eventLabel}` : ""}`,
      })
      .select("*")
      .maybeSingle()

    if (fbErr) {
      const yet = await findExistingReferral(
        supabase,
        panelIds,
        guestCodigo,
      )
      if (yet) {
        return toResult(yet, {
          storePanelId,
          eventLabel,
          guestCodigo,
          discount,
          isNew: false,
        })
      }
      throw new Error(
        `No se pudo crear el cupón (¿corriste scripts/009_cupones_referidos.sql?): ${errMessage(fbErr)}`,
      )
    }
    if (!fallback) throw new Error("No se pudo crear el cupón.")
    return toResult(fallback as ReferralRow, {
      storePanelId,
      eventLabel,
      guestCodigo,
      discount,
      isNew: true,
    })
  }
}

/**
 * Dedup en listado admin: 1 fila por invitado+panel (o invitado solo).
 * Conserva el más antiguo / el usado.
 */
export function dedupeReferralCouponsForAdmin(coupons: CuponRow[]): CuponRow[] {
  const others = coupons.filter((c) => c.categoria !== REFERRAL_CATEGORY)
  const referidos = coupons.filter((c) => c.categoria === REFERRAL_CATEGORY)

  const groups = new Map<string, CuponRow[]>()
  for (const c of referidos) {
    const inv =
      (typeof c.invitado_codigo === "string" && c.invitado_codigo.trim()) ||
      (() => {
        const m = String(c.usado_nombre || "").match(/^ref:[^:]+:([^|]+)/)
        return m?.[1]?.trim() || c.codigo
      })()
    const panel =
      (typeof c.panel_id === "string" && c.panel_id.trim()) ||
      (() => {
        const m = String(c.usado_nombre || "").match(/^ref:([^:]+):/)
        return m?.[1]?.trim() || ""
      })()
    const key = `${panel}::${inv}`
    const list = groups.get(key) || []
    list.push(c)
    groups.set(key, list)
  }

  const unique: CuponRow[] = []
  for (const list of groups.values()) {
    if (list.length === 1) {
      unique.push(list[0])
      continue
    }
    list.sort((a, b) => {
      if (a.usado && !b.usado) return -1
      if (!a.usado && b.usado) return 1
      const ta =
        (a.activado_at && Date.parse(a.activado_at)) ||
        (a.created_at && Date.parse(a.created_at)) ||
        0
      const tb =
        (b.activado_at && Date.parse(b.activado_at)) ||
        (b.created_at && Date.parse(b.created_at)) ||
        0
      return ta - tb
    })
    unique.push(list[0])
  }

  return [...others, ...unique]
}
