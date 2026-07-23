import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/** Cliente con service role (bypasea RLS). Solo usar en API routes / scripts. */
export function createServiceClient() {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!urlRaw || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisá .env.local).",
    )
  }
  const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
