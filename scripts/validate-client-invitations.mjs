#!/usr/bin/env node
/**
 * Valida todos los JSON en data/clientes/** (parseo, estructura mínima, ids únicos,
 * archivos bajo public/, y reglas que suelen romper el runtime en el navegador).
 *
 * Uso: node scripts/validate-client-invitations.mjs
 *      npm run validate:clientes
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const CLIENTES_DIR = path.join(ROOT, "data", "clientes")
const PUBLIC_DIR = path.join(ROOT, "public")

const ASSET_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".mp3",
  ".mp4",
  ".mov",
  ".webm",
  ".pdf",
  ".woff2",
])

/** @typedef {{ file: string, tipo: string, slug: string, messages: string[] }} Issue */

/** @param {unknown} value @param {(s: string) => void} cb */
function walkStrings(value, cb) {
  if (typeof value === "string") {
    cb(value)
    return
  }
  if (Array.isArray(value)) {
    for (const v of value) walkStrings(v, cb)
    return
  }
  if (value && typeof value === "object") {
    for (const k of Object.keys(value)) {
      if (k.startsWith("//") || k.startsWith("_comment")) continue
      walkStrings(/** @type {Record<string, unknown>} */ (value)[k], cb)
    }
  }
}

/** @param {string} s */
function isProbablyPublicFile(s) {
  if (typeof s !== "string" || !s.startsWith("/") || s.startsWith("//")) return false
  if (s.startsWith("/api/") || s.startsWith("/_next/")) return false
  const noQuery = s.split("?")[0]
  const ext = path.posix.extname(noQuery).toLowerCase()
  if (ASSET_EXT.has(ext)) return true
  if (noQuery.startsWith("/clientes/")) return true
  if (noQuery.startsWith("/landing/")) return true
  if (noQuery.startsWith("/music/")) return true
  return false
}

/** @param {string} urlPath */
function publicPathFromUrl(urlPath) {
  const clean = urlPath.split("?")[0].replace(/^\/+/, "")
  return path.join(PUBLIC_DIR, ...clean.split("/"))
}

/** @param {string} dir */
function listJsonFiles(dir) {
  /** @type {string[]} */
  const out = []
  if (!fs.existsSync(dir)) return out
  const tipos = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())
  for (const t of tipos) {
    const tipoPath = path.join(dir, t.name)
    for (const f of fs.readdirSync(tipoPath)) {
      if (f.endsWith(".json")) out.push(path.join(tipoPath, f))
    }
  }
  return out
}

/** @param {Record<string, unknown>} data @param {string} fileLabel */
function validateSections(data, fileLabel) {
  /** @type {string[]} */
  const msgs = []
  const sections = data.sections
  if (!Array.isArray(sections)) {
    msgs.push("sections debe ser un array")
    return msgs
  }
  if (sections.length === 0) msgs.push("sections está vacío (¿invitación sin contenido?)")

  /** @type {Map<string, number>} */
  const idCount = new Map()
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]
    if (!sec || typeof sec !== "object") {
      msgs.push(`sections[${i}] no es un objeto`)
      continue
    }
    const s = /** @type {Record<string, unknown>} */ (sec)
    if (typeof s.type !== "string" || !s.type) msgs.push(`sections[${i}]: falta "type"`)
    if (typeof s.id !== "string" || !s.id) msgs.push(`sections[${i}]: falta "id"`)
    else idCount.set(s.id, (idCount.get(s.id) || 0) + 1)

    const d = s.data
    if (!d || typeof d !== "object") continue
    const dataObj = /** @type {Record<string, unknown>} */ (d)

    if (s.type === "honeymoon") {
      const showBtn = dataObj.showButton !== false
      if (showBtn && !dataObj.button)
        msgs.push(`sección "${s.id}" (honeymoon): showButton activo pero falta data.button`)
    }
    if (s.type === "dressCode") {
      const showBtn = dataObj.showButton !== false
      if (showBtn && !dataObj.button)
        msgs.push(`sección "${s.id}" (dressCode): showButton activo pero falta data.button`)
    }
    if (s.type === "universalInfo") {
      const showBtn = dataObj.showButton === true
      if (showBtn && !dataObj.button)
        msgs.push(`sección "${s.id}" (universalInfo): showButton true pero falta data.button`)
    }
  }

  for (const [id, n] of idCount) {
    if (n > 1) msgs.push(`id de sección duplicado "${id}" (${n} veces) — rompe keys de React`)
  }

  return msgs
}

/** @param {Record<string, unknown>} data @param {string} fileLabel */
function validateAssetPaths(data, fileLabel) {
  /** @type {string[]} */
  const msgs = []
  /** @type {Set<string>} */
  const seen = new Set()
  walkStrings(data, (s) => {
    if (!isProbablyPublicFile(s)) return
    if (seen.has(s)) return
    seen.add(s)
    const disk = publicPathFromUrl(s)
    if (!fs.existsSync(disk)) msgs.push(`archivo ausente en public: ${s}`)
  })
  return msgs
}

/** @param {Record<string, unknown>} data */
function validateTopLevel(data) {
  /** @type {string[]} */
  const msgs = []
  if (!data.meta || typeof data.meta !== "object") msgs.push('falta objeto "meta"')
  else {
    const m = /** @type {Record<string, unknown>} */ (data.meta)
    if (typeof m.title !== "string") msgs.push("meta.title debe ser string")
    if (typeof m.description !== "string") msgs.push("meta.description debe ser string")
  }
  if (!data.theme || typeof data.theme !== "object") msgs.push('falta objeto "theme"')
  if (!data.overlay || typeof data.overlay !== "object") msgs.push('falta objeto "overlay" (overlay.enabled se usa al cargar)')
  if (!data.hero || typeof data.hero !== "object") msgs.push('falta objeto "hero"')
  if (!data.music || typeof data.music !== "object") msgs.push('falta objeto "music"')
  return msgs
}

function main() {
  const files = listJsonFiles(CLIENTES_DIR)
  if (files.length === 0) {
    console.error("No se encontraron JSON en", CLIENTES_DIR)
    process.exit(1)
  }

  /** @type {Issue[]} */
  const issues = []

  for (const file of files) {
    const rel = path.relative(ROOT, file)
    const tipo = path.basename(path.dirname(file))
    const base = path.basename(file, ".json")
    const slug = base.replace(/^\d+-/, "")
    /** @type {string[]} */
    const messages = []

    let data
    try {
      const raw = fs.readFileSync(file, "utf8")
      data = JSON.parse(raw)
    } catch (e) {
      messages.push(`JSON inválido: ${/** @type {Error} */ (e).message}`)
      issues.push({ file: rel, tipo, slug, messages })
      continue
    }

    if (!data || typeof data !== "object") {
      messages.push("raíz del JSON no es un objeto")
      issues.push({ file: rel, tipo, slug, messages })
      continue
    }

    const obj = /** @type {Record<string, unknown>} */ (data)
    messages.push(...validateTopLevel(obj))
    messages.push(...validateSections(obj, rel))
    messages.push(...validateAssetPaths(obj, rel))

    if (messages.length) issues.push({ file: rel, tipo, slug, messages })
  }

  if (issues.length === 0) {
    console.log(`OK — ${files.length} invitación(es) sin problemas detectados por este script.`)
    process.exit(0)
  }

  console.error(`\nSe encontraron problemas en ${issues.length} archivo(s) (de ${files.length}):\n`)
  for (const i of issues) {
    console.error(`— ${i.file}  (${i.tipo}/${i.slug})`)
    for (const m of i.messages) console.error(`    · ${m}`)
    console.error("")
  }
  console.error(
    "Corregí los ítems arriba y volvé a ejecutar: npm run validate:clientes\n" +
      "En CI: ejecutá este script antes de `next build` para evitar sorpresas en producción.\n",
  )
  process.exit(1)
}

main()
