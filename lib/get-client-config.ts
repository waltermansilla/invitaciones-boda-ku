import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"

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
  [key: string]: unknown
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
