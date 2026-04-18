#!/usr/bin/env node
/**
 * Genera un panelId poco predecible: {slug}-{tokenAleatorio}
 * Ejemplo: mi-boda-kQ8nR2xLm4pZ
 *
 * Uso:
 *   npm run panel:gen-id
 *   npm run panel:gen-id -- anto-walter
 *   node scripts/generate-panel-id.mjs ivan-meliza
 */

import { customAlphabet } from "nanoid"

// Sin guiones para que el slug sea el único separador “humano” antes del token
const token = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12)()

const slugArg = process.argv.slice(2).find((a) => !a.startsWith("-"))
const slug = (slugArg || "mi-evento")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9-]/g, "")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "") || "mi-evento"

console.log(`${slug}-${token}`)
console.error("")
console.error("Copiá esa cadena en rsvpPanel.panelId del JSON del cliente (y el mismo valor en Supabase eventos.panel_id si ya migraste datos).")
