import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Cliente simple para rutas de API (sin cookies)
export function createApiClient() {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!urlRaw || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY (revisá .env.local).",
    )
  }
  const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`
  return createSupabaseClient(url, key)
}
