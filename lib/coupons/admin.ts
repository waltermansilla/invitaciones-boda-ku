import { createServiceClient } from "@/lib/supabase/service"
import {
  generatePrefixedSeries,
  inferSeriesFromCodes,
  isCouponExpired,
  normalizeCouponCode,
  parsePrefixedCode,
  slugifyCategory,
  COUPON_BATCH_MAX,
  COUPON_CODE_MAX_LEN,
  COUPON_PREFIX_MAX_LEN,
  COUPON_START_MAX,
  COUPON_STEP_MAX,
} from "@/lib/coupons/logic"
import type { CuponRow } from "@/lib/coupons/types"

export {
  COUPON_BATCH_MAX,
  COUPON_CODE_MAX_LEN,
  COUPON_PREFIX_MAX_LEN,
  COUPON_START_MAX,
  COUPON_STEP_MAX,
} from "@/lib/coupons/logic"

const CLEAR_USAGE = {
  usado: false,
  usado_at: null as string | null,
  usado_device: null as string | null,
  usado_nombre: null as string | null,
  usado_tipo_evento: null as string | null,
  enviado: false,
  enviado_email: null as string | null,
  enviado_at: null as string | null,
}

function assertExpires(expiresOn: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
    throw new Error("La fecha de vencimiento debe ser YYYY-MM-DD.")
  }
}

function assertDiscount(pct: number) {
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
    throw new Error("El descuento debe ser un % entre 1 y 100.")
  }
}

function assertBatchCount(count: number, label = "cantidad") {
  if (!Number.isInteger(count) || count < 1 || count > COUPON_BATCH_MAX) {
    throw new Error(
      `La ${label} debe ser un entero entre 1 y ${COUPON_BATCH_MAX}.`,
    )
  }
}

function assertPrefix(prefix: string) {
  if (!prefix || !/^[A-ZÁÉÍÓÚÑÜ]+$/i.test(prefix)) {
    throw new Error("El prefijo debe ser solo letras (ej. BODA).")
  }
  if (prefix.length > COUPON_PREFIX_MAX_LEN) {
    throw new Error(
      `El prefijo puede tener hasta ${COUPON_PREFIX_MAX_LEN} letras.`,
    )
  }
}

export async function resetCouponById(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .update(CLEAR_USAGE)
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error("Cupón no encontrado.")
  return data as CuponRow
}

export async function resetCouponsByCategory(categoria: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .update(CLEAR_USAGE)
    .eq("categoria", categoria)
    .eq("usado", true)
    .select("id")
  if (error) throw error
  return { resetCount: data?.length ?? 0 }
}

export async function resetAllCoupons() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .update(CLEAR_USAGE)
    .eq("usado", true)
    .select("id")
  if (error) throw error
  return { resetCount: data?.length ?? 0 }
}

export async function deleteCouponById(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .delete()
    .eq("id", id)
    .select("id, codigo")
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error("Cupón no encontrado.")
  return data
}

export async function markCouponUsedById(
  id: string,
  opts?: { reservedName?: string; invitationType?: string },
) {
  const supabase = createServiceClient()
  const { data: current, error: getErr } = await supabase
    .from("cupones")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (getErr) throw getErr
  if (!current) throw new Error("Cupón no encontrado.")

  const { data, error } = await supabase
    .from("cupones")
    .update({
      usado: true,
      usado_at: new Date().toISOString(),
      usado_device: current.usado_device || "admin-manual",
      usado_nombre:
        opts?.reservedName?.trim() || current.usado_nombre || "Manual",
      usado_tipo_evento:
        opts?.invitationType?.trim() || current.usado_tipo_evento || null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data as CuponRow
}

export async function markCouponSentById(
  id: string,
  destinatario?: string | null,
) {
  const supabase = createServiceClient()
  const trimmed = destinatario?.trim() || null
  const { data, error } = await supabase
    .from("cupones")
    .update({
      enviado: true,
      enviado_email: trimmed,
      enviado_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) {
    if (
      error.message.includes("enviado") ||
      error.code === "PGRST204" ||
      error.message.includes("schema cache")
    ) {
      throw new Error(
        "Falta la columna enviado. Corré scripts/007_coupon_enviado.sql en Supabase.",
      )
    }
    throw error
  }
  if (!data) throw new Error("Cupón no encontrado.")
  return data as CuponRow
}

export async function updateSeries(opts: {
  categoria: string
  discountPercent: number
  expiresOn: string
}) {
  const categoria = opts.categoria?.trim()
  if (!categoria) throw new Error("Falta categoría.")
  assertDiscount(opts.discountPercent)
  assertExpires(opts.expiresOn)

  const supabase = createServiceClient()
  const { data: existing, error: exErr } = await supabase
    .from("cupones")
    .select("id")
    .eq("categoria", categoria)
  if (exErr) throw exErr
  if (!existing || existing.length === 0) {
    throw new Error("La serie no tiene cupones.")
  }

  const { data, error } = await supabase
    .from("cupones")
    .update({
      descuento_porcentaje: opts.discountPercent,
      valido_hasta: opts.expiresOn,
    })
    .eq("categoria", categoria)
    .select("id")
  if (error) throw error
  return { updatedCount: data?.length ?? 0 }
}

export async function setSeriesActive(categoria: string, activo: boolean) {
  const cat = categoria?.trim()
  if (!cat) throw new Error("Falta categoría.")
  if (typeof activo !== "boolean") {
    throw new Error("Estado activo inválido.")
  }

  const supabase = createServiceClient()
  const { data: existing, error: exErr } = await supabase
    .from("cupones")
    .select("id")
    .eq("categoria", cat)
  if (exErr) throw exErr
  if (!existing || existing.length === 0) {
    throw new Error("La serie no tiene cupones.")
  }

  const { data, error } = await supabase
    .from("cupones")
    .update({ activo })
    .eq("categoria", cat)
    .select("id")
  if (error) throw error
  return { updatedCount: data?.length ?? 0, activo }
}

/** Hay al menos un cupón activo (serie encendida) y no vencido. */
export async function hasEnabledCouponField(): Promise<boolean> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .select("valido_hasta")
    .eq("activo", true)
    .limit(200)
  if (error) throw error
  if (!data || data.length === 0) return false
  return data.some((row) => !isCouponExpired(row.valido_hasta ?? null))
}

export async function deleteSeries(categoria: string) {
  const cat = categoria?.trim()
  if (!cat) throw new Error("Falta categoría.")

  const supabase = createServiceClient()
  const { data: existing, error: exErr } = await supabase
    .from("cupones")
    .select("id")
    .eq("categoria", cat)
  if (exErr) throw exErr
  if (!existing || existing.length === 0) {
    throw new Error("La serie no tiene cupones.")
  }

  const { data, error } = await supabase
    .from("cupones")
    .delete()
    .eq("categoria", cat)
    .select("id")
  if (error) throw error
  return { deletedCount: data?.length ?? 0 }
}

export type CreateUniqueSeriesInput = {
  categoria?: string
  categoryLabel?: string
  prefix: string
  start: number
  step: number
  count: number
  discountPercent: number
  expiresOn: string
}

export async function createUniqueSeries(input: CreateUniqueSeriesInput) {
  assertDiscount(input.discountPercent)
  assertExpires(input.expiresOn)
  assertBatchCount(input.count)

  const prefix = normalizeCouponCode(input.prefix).replace(/\d+$/g, "")
  assertPrefix(prefix)

  if (
    !Number.isInteger(input.start) ||
    input.start < 0 ||
    input.start > COUPON_START_MAX
  ) {
    throw new Error("El número inicial no es válido.")
  }
  if (
    !Number.isInteger(input.step) ||
    input.step < 1 ||
    input.step > COUPON_STEP_MAX
  ) {
    throw new Error(`El salto debe ser entre 1 y ${COUPON_STEP_MAX}.`)
  }

  const lastNum = input.start + (input.count - 1) * input.step
  if (lastNum > COUPON_START_MAX) {
    throw new Error("La secuencia queda fuera de rango. Bajá cantidad o salto.")
  }

  let categoria = (input.categoria || "").trim()
  if (!categoria && input.categoryLabel?.trim()) {
    const slug = slugifyCategory(input.categoryLabel)
    categoria = slug ? `unico_${slug}` : "unico"
  }
  if (!categoria) categoria = "unico"
  if (
    !categoria.startsWith("unico") &&
    categoria !== "descuento_fijo" &&
    !categoria.startsWith("libre")
  ) {
    categoria = `unico_${slugifyCategory(categoria) || "serie"}`
  }

  const codes = generatePrefixedSeries({
    prefix,
    start: input.start,
    step: input.step,
    count: input.count,
  })

  const supabase = createServiceClient()
  const { data: existing, error: exErr } = await supabase
    .from("cupones")
    .select("codigo")
    .in("codigo", codes)
  if (exErr) throw exErr
  if (existing && existing.length > 0) {
    throw new Error(
      `Ya existen: ${existing
        .map((e) => e.codigo)
        .slice(0, 8)
        .join(", ")}${existing.length > 8 ? "…" : ""}. Cambiá inicio/cantidad.`,
    )
  }

  const rows = codes.map((codigo) => ({
    codigo,
    categoria,
    descuento_porcentaje: input.discountPercent,
    valido_hasta: input.expiresOn,
    activo: true,
    ...CLEAR_USAGE,
  }))

  const { data, error } = await supabase.from("cupones").insert(rows).select("*")
  if (error) throw error
  return {
    categoria,
    codes,
    coupons: (data ?? []) as CuponRow[],
  }
}

export async function addNextUniqueInCategory(
  categoria: string,
  count = 1,
) {
  assertBatchCount(count, "cantidad a agregar")

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .eq("categoria", categoria)
    .order("codigo", { ascending: true })
  if (error) throw error
  const coupons = (data ?? []) as CuponRow[]
  if (coupons.length === 0) {
    throw new Error(
      "No hay cupones en esta categoría para continuar la secuencia.",
    )
  }

  const inferred = inferSeriesFromCodes(coupons.map((c) => c.codigo))
  if (!inferred) {
    throw new Error(
      "No se pudo inferir la secuencia (se espera palabra + número, ej. BODA1250).",
    )
  }

  const codes = generatePrefixedSeries({
    prefix: inferred.prefix,
    start: inferred.nextNum,
    step: inferred.step,
    count,
  })

  const { data: clashRows, error: clashErr } = await supabase
    .from("cupones")
    .select("codigo")
    .in("codigo", codes)
  if (clashErr) throw clashErr
  if (clashRows && clashRows.length > 0) {
    throw new Error(
      `Ya existen: ${clashRows.map((c) => c.codigo).join(", ")}.`,
    )
  }

  const template = coupons[coupons.length - 1]
  const samePrefix = coupons
    .map((c) => ({ c, p: parsePrefixedCode(c.codigo) }))
    .filter((x) => x.p?.prefix === inferred.prefix)
    .sort((a, b) => (a.p!.num > b.p!.num ? -1 : 1))
  const base = samePrefix[0]?.c ?? template

  const rows = codes.map((codigo) => ({
    codigo,
    categoria,
    descuento_porcentaje: base.descuento_porcentaje,
    valido_hasta: base.valido_hasta,
    activo: true,
    ...CLEAR_USAGE,
  }))

  const { data: inserted, error: insErr } = await supabase
    .from("cupones")
    .insert(rows)
    .select("*")
  if (insErr) throw insErr
  return {
    coupons: (inserted ?? []) as CuponRow[],
    codes,
    inferred,
    count: codes.length,
  }
}

export type CreateLibreInput = {
  categoria?: string
  categoryLabel?: string
  code: string
  discountPercent: number
  expiresOn: string
}

export async function createLibreCoupon(input: CreateLibreInput) {
  assertDiscount(input.discountPercent)
  assertExpires(input.expiresOn)

  const codigo = normalizeCouponCode(input.code)
  if (codigo.length < 3) {
    throw new Error("El código debe tener al menos 3 caracteres.")
  }
  if (codigo.length > COUPON_CODE_MAX_LEN) {
    throw new Error(
      `El código puede tener hasta ${COUPON_CODE_MAX_LEN} caracteres.`,
    )
  }

  let categoria = (input.categoria || "").trim()
  if (!categoria && input.categoryLabel?.trim()) {
    const slug = slugifyCategory(input.categoryLabel)
    categoria = slug ? `libre_${slug}` : "libre"
  }
  if (!categoria) categoria = "libre"
  if (!categoria.startsWith("libre")) {
    categoria = `libre_${slugifyCategory(categoria) || "code"}`
  }

  const supabase = createServiceClient()
  const { data: clash } = await supabase
    .from("cupones")
    .select("id")
    .eq("codigo", codigo)
    .maybeSingle()
  if (clash) throw new Error(`El código ${codigo} ya existe.`)

  const { data, error } = await supabase
    .from("cupones")
    .insert({
      codigo,
      categoria,
      descuento_porcentaje: input.discountPercent,
      valido_hasta: input.expiresOn,
      activo: true,
      ...CLEAR_USAGE,
    })
    .select("*")
    .maybeSingle()
  if (error) throw error
  return { coupon: data as CuponRow, categoria }
}
