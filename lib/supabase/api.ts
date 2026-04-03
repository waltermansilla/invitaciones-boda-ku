import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente simple para rutas de API (sin cookies)
export function createApiClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
