#!/usr/bin/env node
/**
 * Lista filas `eventos` en Supabase cuyo `panel_id` no aparece en ningún JSON
 * bajo data/clientes/** (rsvpPanel.panelId ni rsvpPanel.legacyPanelIds).
 * Por cada huérfano muestra cuántos invitados tiene y si con_datos=Sí.
 *
 * Uso:
 *   node scripts/audit-orphan-panel-eventos.mjs
 *   node scripts/audit-orphan-panel-eventos.mjs --delete
 *
 * `--delete` pide escribir YES en consola y borra solo esos eventos (CASCADE a invitados/integrantes).
 * Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (igual que la app).
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import readline from "readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const CLIENTES_DIR = path.join(ROOT, "data", "clientes")

/** @param {string} dir */
function listJsonFiles(dir) {
  /** @type {string[]} */
  const out = []
  if (!fs.existsSync(dir)) return out
  const tipos = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())
  for (const t of tipos) {
    const sub = path.join(dir, t.name)
    for (const f of fs.readdirSync(sub)) {
      if (f.endsWith(".json")) out.push(path.join(sub, f))
    }
  }
  return out
}

/** @param {unknown} raw @param {Set<string>} into */
function addPanelStringsFromRsvp(raw, into) {
  if (!raw || typeof raw !== "object") return
  const rp = /** @type {Record<string, unknown>} */ (raw).rsvpPanel
  if (!rp || typeof rp !== "object") return
  const panelId = /** @type {Record<string, unknown>} */ (rp).panelId
  if (typeof panelId === "string") {
    const t = panelId.trim()
    if (t) into.add(t)
  }
  const leg = /** @type {Record<string, unknown>} */ (rp).legacyPanelIds
  if (Array.isArray(leg)) {
    for (const x of leg) {
      if (typeof x === "string") {
        const t = x.trim()
        if (t) into.add(t)
      }
    }
  }
}

/** Referenciados por algún cliente (panelId o legacyPanelIds). */
function collectPanelIdsInUseFromDisk() {
  const inUse = new Set()
  for (const file of listJsonFiles(CLIENTES_DIR)) {
    try {
      const json = JSON.parse(fs.readFileSync(file, "utf-8"))
      addPanelStringsFromRsvp(json, inUse)
    } catch {
      /* skip */
    }
  }
  return inUse
}

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local")
  if (!fs.existsSync(p)) return
  const text = fs.readFileSync(p, "utf-8")
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

function createSupabaseFromEnv() {
  loadEnvLocal()
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!urlRaw || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local en la raíz del proyecto).",
    )
    process.exit(1)
  }
  const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`
  return createClient(url, key)
}

async function main() {
  const wantDelete = process.argv.includes("--delete")

  const inUse = collectPanelIdsInUseFromDisk()
  console.log(`Panel ids referenciados en data/clientes (panelId + legacyPanelIds): ${inUse.size}`)

  const supabase = createSupabaseFromEnv()

  const { data: eventos, error } = await supabase.from("eventos").select("id, panel_id, created_at")

  if (error) {
    console.error("Error leyendo eventos:", error.message)
    process.exit(1)
  }

  const rows = eventos || []
  /** @type {{ id: string, panel_id: string, created_at: string | null }[]} */
  const orphans = rows.filter(
    (e) => typeof e.panel_id === "string" && e.panel_id && !inUse.has(e.panel_id),
  )

  if (orphans.length === 0) {
    console.log("\nNo hay eventos huérfanos (todos los panel_id de la base están en algún JSON).")
    process.exit(0)
  }

  const orphanIds = orphans.map((o) => o.id)
  const { data: invRows, error: invErr } = await supabase
    .from("invitados")
    .select("evento_id")
    .in("evento_id", orphanIds)

  if (invErr) {
    console.error("Error contando invitados:", invErr.message)
    process.exit(1)
  }

  /** @type {Record<string, number>} */
  const invCountByEvento = {}
  for (const r of invRows || []) {
    const id = r.evento_id
    if (typeof id === "string") invCountByEvento[id] = (invCountByEvento[id] || 0) + 1
  }

  console.log(`\nHuérfanos en Supabase (no referenciados por ningún JSON): ${orphans.length}\n`)
  const withGuests = orphans.filter((o) => (invCountByEvento[o.id] || 0) > 0).length
  console.log(
    "Columnas: num_invitados = filas en tabla invitados de ese evento; con_datos = Sí si hay al menos uno.\n",
  )
  console.log("panel_id\tnum_invitados\tcon_datos\tcreated_at\t\t\tevento id")
  for (const o of orphans) {
    const n = invCountByEvento[o.id] || 0
    const flag = n > 0 ? "Sí" : "No"
    const ca = o.created_at != null ? String(o.created_at) : "-"
    console.log(`${o.panel_id}\t${n}\t${flag}\t${ca}\t${o.id}`)
  }
  console.log(
    `\nResumen: ${orphans.length} evento(s) huérfano(s); ${withGuests} con al menos 1 invitado en base (revisá antes de borrar).`,
  )

  if (!wantDelete) {
    console.log(
      "\nPara borrar solo estas filas (y sus invitados/integrantes por CASCADE), ejecutá:\n  node scripts/audit-orphan-panel-eventos.mjs --delete\n",
    )
    process.exit(0)
  }

  const rl = readline.createInterface({ input, output })
  const answer = await rl.question(
    `\nSe borrarán ${orphans.length} fila(s) de eventos (y datos ligados). Escribí YES para confirmar: `,
  )
  await rl.close()

  if (answer.trim() !== "YES") {
    console.log("Cancelado (no se borró nada).")
    process.exit(0)
  }

  const { error: delErr } = await supabase.from("eventos").delete().in("id", orphanIds)

  if (delErr) {
    console.error("Error borrando:", delErr.message)
    process.exit(1)
  }

  console.log(`Listo: se eliminaron ${orphans.length} evento(s) huérfano(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
