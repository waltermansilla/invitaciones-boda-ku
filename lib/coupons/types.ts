export type CouponUsageMode = "single_use" | "unlimited" | "public"

/** Fila de `public.cupones` (Supabase). */
export type CuponRow = {
  id: string
  codigo: string
  categoria: string
  descuento_porcentaje: number
  valido_hasta: string | null
  activo: boolean
  usado: boolean
  usado_device: string | null
  usado_tipo_evento: string | null
  usado_nombre: string | null
  usado_at: string | null
  enviado?: boolean
  enviado_email?: string | null
  enviado_at?: string | null
  created_at?: string
  /** Cupones referidos: panel del evento. */
  panel_id?: string | null
  /** Cupones referidos: código del invitado (?i=). */
  invitado_codigo?: string | null
  /** Cupones referidos: "Sofía & Mateo", etc. */
  evento_label?: string | null
  /** Primera apertura del modal (activación del cupón referido). */
  activado_at?: string | null
}

export type AppliedCouponInfo = {
  code: string
  categoryId: string
  categoryLabel: string
  discountPercent: number
  usageMode: CouponUsageMode
}

export type CouponValidateOk = {
  ok: true
  coupon: AppliedCouponInfo
  reused: boolean
}

export type CouponValidateErr = {
  ok: false
  error: string
  code?:
    | "not_found"
    | "expired"
    | "used"
    | "inactive"
    | "invalid"
    | "missing"
    | "server"
}

export type CouponRedeemOk = {
  ok: true
  coupon: AppliedCouponInfo
  reused: boolean
}

export type CouponRedeemErr = CouponValidateErr

/** Metadatos de categoría (hoy conocidos; otras se infieren por prefijo). */
export type CouponCategoryMeta = {
  id: string
  label: string
  description: string
  usageMode: CouponUsageMode
}

export const COUPON_CATEGORY_META: Record<string, CouponCategoryMeta> = {
  unico: {
    id: "unico",
    label: "Único · Formulario insights",
    description:
      "Un solo uso, con palabra + número en secuencia. El mismo navegador puede reaplicar si hubo un error.",
    usageMode: "single_use",
  },
  libre: {
    id: "libre",
    label: "Uso libre",
    description:
      "Un código compartible. Se puede usar las veces que sea hasta la fecha de vencimiento.",
    usageMode: "unlimited",
  },
  referido: {
    id: "referido",
    label: "Referidos · Panel invitados",
    description:
      "25% activados al abrir el cupón desde la invitación (1 por invitado, vence a 30 días). Orden: por activación.",
    usageMode: "single_use",
  },
  // legacy
  descuento_fijo: {
    id: "descuento_fijo",
    label: "Único · Formulario insights",
    description:
      "Un solo uso, 30% off. Enviado por mail a quienes completaron el formulario.",
    usageMode: "single_use",
  },
}

function humanizeCategoryId(id: string): string {
  return id
    .replace(/^unico[_-]?/i, "")
    .replace(/^libre[_-]?/i, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || id
}

export function resolveCategoryMeta(categoria: string): CouponCategoryMeta {
  const known = COUPON_CATEGORY_META[categoria]
  if (known) return known

  const lower = categoria.toLowerCase()
  const isLibre =
    lower === "libre" ||
    lower.startsWith("libre_") ||
    lower.startsWith("libre-")

  if (isLibre) {
    return {
      id: categoria,
      label: `Uso libre · ${humanizeCategoryId(categoria)}`,
      description:
        "Código de uso libre hasta la fecha de vencimiento (no se quema).",
      usageMode: "unlimited",
    }
  }

  const isUnico =
    lower === "unico" ||
    lower.startsWith("unico_") ||
    lower.startsWith("unico-")

  return {
    id: categoria,
    label: isUnico
      ? `Único · ${humanizeCategoryId(categoria)}`
      : humanizeCategoryId(categoria),
    description: "Cupones de un solo uso (secuencia palabra + número).",
    usageMode: "single_use",
  }
}
