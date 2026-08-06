/**
 * Prefijo de cupón referido: nombres sin espacios ni acentos (ej. sofiamateo).
 */

const MAX_PREFIX_LEN = 16

export function stripAccents(raw: string): string {
  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/** Solo letras a-z (minúsculas) para armar prefijo. */
export function slugLetters(raw: string): string {
  return stripAccents(raw)
    .toLowerCase()
    .replace(/[^a-z]/g, "")
}

/**
 * XV: solo quinceañera. Boda: novia+novio (orden bride+groom por costumbre del brief).
 * Override con `codePrefix` si viene del JSON.
 */
export function buildReferralCodePrefix(opts: {
  codePrefix?: string
  brideName?: string
  groomName?: string
  quinceaneraName?: string
}): string {
  const override = opts.codePrefix?.trim()
  if (override) {
    return slugLetters(override).slice(0, MAX_PREFIX_LEN)
  }
  const xv = opts.quinceaneraName?.trim()
  if (xv) {
    return slugLetters(xv).slice(0, MAX_PREFIX_LEN)
  }
  const a = slugLetters(opts.brideName || "")
  const b = slugLetters(opts.groomName || "")
  const combined = `${a}${b}` || a || b
  return combined.slice(0, MAX_PREFIX_LEN)
}

/** sofiamateo + 8 → SOFIAMATEO08 */
export function formatReferralCode(prefix: string, guestNumber: number): string {
  const p = slugLetters(prefix).toUpperCase()
  const n = Math.max(1, Math.floor(guestNumber))
  const numPart = n < 100 ? String(n).padStart(2, "0") : String(n)
  return `${p}${numPart}`
}

/** Fecha civil +N días en Argentina (YYYY-MM-DD). */
export function addDaysArgentina(fromIsoDate: string, days: number): string {
  const [y, m, d] = fromIsoDate.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function todayArgentinaYmd(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

/** "30 de agosto de 2026" / "30 de agosto" si es el año actual. */
export function formatValidityEs(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return ymd
  const date = new Date(y, m - 1, d)
  const nowY = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).slice(0, 4)
  const dayMonth = date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  })
  if (String(y) === nowY) return dayMonth
  return `${dayMonth} de ${y}`
}
