#!/usr/bin/env node
/**
 * Completa cupones BODA1250–BODA1500 en public.cupones (categoría descuento_fijo).
 *
 *   node scripts/seed-coupons.mjs
 *
 * Requiere .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local")
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i <= 0) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function codesFromTo(from = 1250, to = 1500, step = 10) {
  const out = []
  for (let n = from; n <= to; n += step) out.push(`BODA${n}`)
  return out
}

async function main() {
  loadEnvLocal()
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!urlRaw || !key) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }
  const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existing, error: listErr } = await supabase
    .from("cupones")
    .select("codigo")
  if (listErr) {
    console.error(listErr.message)
    process.exit(1)
  }

  const have = new Set((existing ?? []).map((r) => r.codigo))
  const missing = codesFromTo().filter((c) => !have.has(c))

  if (missing.length === 0) {
    console.log(`OK · ya están los ${codesFromTo().length} códigos BODA1250…1500`)
  } else {
    const rows = missing.map((codigo) => ({
      codigo,
      categoria: "unico",
      descuento_porcentaje: 30,
      valido_hasta: "2026-08-05",
      activo: true,
      usado: false,
    }))
    const { error: insertErr } = await supabase.from("cupones").insert(rows)
    if (insertErr) {
      console.error(insertErr.message)
      process.exit(1)
    }
    console.log(`OK · insertados ${missing.length}: ${missing.join(", ")}`)
  }

  // Normalizar categoría legacy
  await supabase
    .from("cupones")
    .update({ categoria: "unico" })
    .eq("categoria", "descuento_fijo")

  const { count } = await supabase
    .from("cupones")
    .select("*", { count: "exact", head: true })
    .eq("categoria", "unico")

  console.log(`OK · ${count ?? "?"} cupones en categoría unico`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
