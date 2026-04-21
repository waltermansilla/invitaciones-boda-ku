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
export function getClientConfig(tipo: string, slug: string): ClientConfig {
  const filePath = resolveClientFilePath(tipo, slug)
  if (!filePath || !fs.existsSync(filePath)) {
    notFound()
  }
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as ClientConfig
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
