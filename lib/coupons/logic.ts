import {
  COUPON_CATEGORY_META,
  resolveCategoryMeta,
  type AppliedCouponInfo,
  type CouponUsageMode,
  type CuponRow,
} from "./types"

export const COUPON_CLAIM_STORAGE_KEY = "mu-coupon-claim-v1"

/** Tope por alta de lote (crear serie o agregar siguientes). */
export const COUPON_BATCH_MAX = 100
export const COUPON_PREFIX_MAX_LEN = 16
export const COUPON_CODE_MAX_LEN = 32
export const COUPON_STEP_MAX = 1000
export const COUPON_START_MAX = 9_999_999

/** Normaliza código: trim + mayúsculas (BODA1250 == boda1250). */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "")
}

/** Fecha civil hoy en Argentina (YYYY-MM-DD). */
export function todayInArgentina(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

/** Válido hasta valido_hasta inclusive. */
export function isCouponExpired(validoHasta: string | null): boolean {
  if (!validoHasta) return false
  return validoHasta < todayInArgentina()
}

export function applyCouponDiscount(
  total: number,
  discountPercent: number,
): number {
  if (!Number.isFinite(total) || total < 0) return 0
  const pct = Math.min(100, Math.max(0, Number(discountPercent)))
  return Math.round(total * (1 - pct / 100))
}

export function toAppliedCouponInfo(row: CuponRow): AppliedCouponInfo {
  const meta = resolveCategoryMeta(row.categoria)
  return {
    code: row.codigo,
    categoryId: meta.id,
    categoryLabel: meta.label,
    discountPercent: Number(row.descuento_porcentaje) || 0,
    usageMode: meta.usageMode,
  }
}

export function couponPublicError(
  kind:
    | "not_found"
    | "expired"
    | "used"
    | "inactive"
    | "invalid"
    | "missing"
    | "server",
  lang: "es" | "en" = "es",
): string {
  const es = {
    not_found: "Ese cupón no existe.",
    expired: "Este cupón ya venció.",
    used: "Este cupón ya fue usado.",
    inactive: "Este cupón no está activo.",
    invalid: "Ingresá un cupón válido.",
    missing: "Escribí un cupón para aplicar.",
    server: "No pudimos validar el cupón. Probá de nuevo.",
  } as const
  const en = {
    not_found: "That coupon doesn’t exist.",
    expired: "This coupon has expired.",
    used: "This coupon has already been used.",
    inactive: "This coupon is not active.",
    invalid: "Enter a valid coupon.",
    missing: "Enter a coupon to apply.",
    server: "We couldn’t validate the coupon. Try again.",
  } as const
  return (lang === "en" ? en : es)[kind]
}

/** Serie BODA1250 … BODA1500 de 10 en 10. */
export function generateBodaInsightCodes(
  from = 1250,
  to = 1500,
  step = 10,
): string[] {
  const codes: string[] = []
  for (let n = from; n <= to; n += step) {
    codes.push(`BODA${n}`)
  }
  return codes
}

export function listKnownCategoryIds(): string[] {
  return Object.keys(COUPON_CATEGORY_META)
}

/** Prefijo letras + número final: BODA1250 → { prefix: "BODA", num: 1250 }. */
export function parsePrefixedCode(
  code: string,
): { prefix: string; num: number } | null {
  const normalized = normalizeCouponCode(code)
  const m = normalized.match(/^([A-ZÁÉÍÓÚÑÜ]+)(\d+)$/i)
  if (!m) return null
  return { prefix: m[1].toUpperCase(), num: Number(m[2]) }
}

export function buildPrefixedCode(prefix: string, num: number): string {
  const p = normalizeCouponCode(prefix).replace(/\d+$/g, "")
  if (!p) return String(num)
  return `${p}${num}`
}

export function generatePrefixedSeries(opts: {
  prefix: string
  start: number
  step: number
  count: number
}): string[] {
  const { prefix, start, step, count } = opts
  if (count < 1 || step < 1 || !Number.isFinite(start)) return []
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(buildPrefixedCode(prefix, start + i * step))
  }
  return out
}

export type InferredSeries = {
  prefix: string
  step: number
  firstNum: number
  firstCode: string
  lastNum: number
  nextNum: number
  nextCode: string
}

/** Infiere secuencia a partir de códigos palabra+número de una categoría. */
export function inferSeriesFromCodes(codes: string[]): InferredSeries | null {
  const parsed = codes
    .map(parsePrefixedCode)
    .filter((x): x is { prefix: string; num: number } => Boolean(x))
  if (parsed.length === 0) return null

  const byPrefix = new Map<string, number[]>()
  for (const p of parsed) {
    const list = byPrefix.get(p.prefix) ?? []
    list.push(p.num)
    byPrefix.set(p.prefix, list)
  }

  let bestPrefix = ""
  let bestNums: number[] = []
  for (const [prefix, nums] of byPrefix) {
    if (nums.length > bestNums.length) {
      bestPrefix = prefix
      bestNums = nums
    }
  }
  const sorted = [...new Set(bestNums)].sort((a, b) => a - b)
  if (sorted.length === 0) return null

  let step = 10
  if (sorted.length >= 2) {
    const gaps = []
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(sorted[i] - sorted[i - 1])
    }
    gaps.sort((a, b) => a - b)
    step = gaps[0] > 0 ? gaps[0] : 10
  }

  const firstNum = sorted[0]
  const lastNum = sorted[sorted.length - 1]
  const nextNum = lastNum + step
  return {
    prefix: bestPrefix,
    step,
    firstNum,
    firstCode: buildPrefixedCode(bestPrefix, firstNum),
    lastNum,
    nextNum,
    nextCode: buildPrefixedCode(bestPrefix, nextNum),
  }
}

export function slugifyCategory(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48)
}

export function usageModeForCategory(categoria: string): CouponUsageMode {
  return resolveCategoryMeta(categoria).usageMode
}

export function isUnlimitedCategory(categoria: string): boolean {
  return usageModeForCategory(categoria) === "unlimited"
}
