import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import { createHash } from "crypto"

export interface ClientConfig {
  meta: {
    title: string
    description: string
    lang: string
    [key: string]: unknown
  }
  theme: {
    primaryColor: string
    backgroundColor: string
    textColor: string
    lightBgTextColor?: string
    darkBgTextColor?: string
    accentBackground: string
    modalTextColor?: string
    font: {
      family: string
      weights: string
    }
    [key: string]: unknown
  }
  overlay: Record<string, unknown>
  hero: Record<string, unknown>
  music: Record<string, unknown>
  sections: Array<Record<string, unknown>>
  variants?: Record<string, unknown>
  access?: {
    tokenEnabled?: boolean
    /** Token real (opcional, útil para admin interno). */
    token?: string
    tokenHash?: string
    /** Compatibilidad: permite entrar sin token hasta esta fecha (YYYY-MM-DD). */
    allowLegacyUntil?: string
  }
  [key: string]: unknown
}

interface VariantConfig extends Record<string, unknown> {
  sections?: Array<Record<string, unknown>>
  replaceSections?: boolean
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function isBeforeOrEqualToday(dateIso: string): boolean {
  const d = new Date(`${dateIso}T23:59:59.999Z`)
  if (Number.isNaN(d.getTime())) return false
  return Date.now() <= d.getTime()
}

export function accessTokenRequired(config: ClientConfig): boolean {
  const access = config.access
  if (!access?.tokenEnabled) return false
  if (
    (!access.tokenHash || access.tokenHash.length < 32) &&
    (!access.token || !/^[A-Za-z0-9]{6}$/.test(access.token))
  ) {
    return false
  }
  if (access.allowLegacyUntil && isBeforeOrEqualToday(access.allowLegacyUntil)) {
    return false
  }
  return true
}

export function isAccessTokenValid(config: ClientConfig, token: string | undefined): boolean {
  if (!accessTokenRequired(config)) return true
  if (!token) return false
  if (!/^[A-Za-z0-9]{6}$/.test(token)) return false
  const expected =
    config.access?.tokenHash?.toLowerCase() ||
    (config.access?.token ? sha256Hex(config.access.token).toLowerCase() : "")
  return sha256Hex(token).toLowerCase() === expected
}

function slugFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.json$/i, "")
  return withoutExt.replace(/^\d+-/, "")
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(patch)) {
    return patch as T
  }
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return patch as T
  }
  const out: Record<string, unknown> = { ...base }
  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = (base as Record<string, unknown>)[key]
    out[key] =
      isPlainObject(baseValue) && isPlainObject(patchValue)
        ? deepMerge(baseValue, patchValue)
        : patchValue
  }
  return out as T
}

function applyVariantToConfig(
  baseConfig: ClientConfig,
  variantKey: string | undefined,
): ClientConfig {
  const key = typeof variantKey === "string" ? variantKey.trim() : ""
  if (!key) return baseConfig

  const variants = baseConfig.variants
  if (!isPlainObject(variants)) return baseConfig
  const variantRaw = variants[key]
  if (!isPlainObject(variantRaw)) return baseConfig

  const variant = variantRaw as VariantConfig
  const result = deepMerge(
    JSON.parse(JSON.stringify(baseConfig)) as ClientConfig,
    {},
  )

  for (const [k, v] of Object.entries(variant)) {
    if (k === "sections" || k === "replaceSections" || k === "variants") continue
    ;(result as Record<string, unknown>)[k] = deepMerge(
      (result as Record<string, unknown>)[k],
      v,
    )
  }

  const currentSections = Array.isArray(result.sections) ? [...result.sections] : []
  const sectionPatches = Array.isArray(variant.sections) ? variant.sections : []
  if (sectionPatches.length > 0) {
    if (variant.replaceSections) {
      result.sections = sectionPatches
    } else {
      for (const patch of sectionPatches) {
        const patchId = typeof patch?.id === "string" ? patch.id : ""
        if (!patchId) {
          currentSections.push(patch)
          continue
        }
        const existingIdx = currentSections.findIndex(
          (s) => typeof s?.id === "string" && s.id === patchId,
        )
        if (existingIdx === -1) {
          currentSections.push(patch)
          continue
        }
        currentSections[existingIdx] = deepMerge(currentSections[existingIdx], patch)
      }
      result.sections = currentSections
    }
  }

  return result
}

function resolveClientFilePath(tipo: string, slug: string): string | null {
  const tipoDir = path.join(process.cwd(), "data", "clientes", tipo)
  if (!fs.existsSync(tipoDir)) return null

  const direct = path.join(tipoDir, `${slug}.json`)
  if (fs.existsSync(direct)) return direct

  const files = fs.readdirSync(tipoDir).filter((f) => f.endsWith(".json"))
  const match = files.find((file) => slugFromFileName(file) === slug)
  if (!match) return null
  return path.join(tipoDir, match)
}

/**
 * Loads a client config JSON from data/clientes/{tipo}/{slug}.json
 * Throws notFound() if the file doesn't exist.
 */
export function getClientConfig(
  tipo: string,
  slug: string,
  variantKey?: string,
): ClientConfig {
  const filePath = resolveClientFilePath(tipo, slug)
  if (!filePath || !fs.existsSync(filePath)) {
    notFound()
  }
  const raw = fs.readFileSync(filePath, "utf-8")
  const parsed = JSON.parse(raw) as ClientConfig
  return applyVariantToConfig(parsed, variantKey)
}

/**
 * Returns all available client slugs for generateStaticParams.
 */
export function getAllClientParams(): { tipo: string; slug: string }[] {
  const clientesDir = path.join(process.cwd(), "data", "clientes")
  if (!fs.existsSync(clientesDir)) return []

  const tipos = fs.readdirSync(clientesDir).filter((t) =>
    fs.statSync(path.join(clientesDir, t)).isDirectory()
  )

  const params: { tipo: string; slug: string }[] = []
  for (const tipo of tipos) {
    const tipoDir = path.join(clientesDir, tipo)
    const files = fs.readdirSync(tipoDir).filter((f) => f.endsWith(".json"))
    for (const file of files) {
      params.push({ tipo, slug: slugFromFileName(file) })
    }
  }
  return params
}
