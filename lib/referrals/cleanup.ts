import { createServiceClient } from "@/lib/supabase/service"
import { REFERRAL_CATEGORY } from "@/lib/referrals/activate"

/**
 * Al borrar invitado: elimina cupones referidos no usados.
 * Si el cupón ya fue usado en una reserva, se mantiene como historial.
 * Los vencidos sin usar se borran acá (invitado ya no existe); las stats de
 * vistos se conservan en los que no se borraron por otras vías (expiran en lista).
 *
 * Nota de producto actual: borrar invitado → borrar cupón si !usado.
 * Vencidos sin usar que siguen en listado (invitado no borrado) = estadística.
 */
export async function deleteUnusedReferralCouponForGuest(opts: {
  panelId: string
  guestCodigo: string
}): Promise<{ deleted: number }> {
  const panelId = opts.panelId.trim()
  const guestCodigo = opts.guestCodigo.trim()
  if (!panelId || !guestCodigo) return { deleted: 0 }

  const supabase = createServiceClient()

  // Preferir columnas nuevas
  const { data: byCols, error: colErr } = await supabase
    .from("cupones")
    .select("id, usado")
    .eq("categoria", REFERRAL_CATEGORY)
    .eq("panel_id", panelId)
    .eq("invitado_codigo", guestCodigo)

  if (!colErr && byCols && byCols.length > 0) {
    const ids = byCols
      .filter((r) => !r.usado)
      .map((r) => r.id as string)
    if (ids.length === 0) return { deleted: 0 }
    const { error } = await supabase.from("cupones").delete().in("id", ids)
    if (error) throw error
    return { deleted: ids.length }
  }

  // Fallback legacy: usado_nombre = ref:panel:codigo...
  const marker = `ref:${panelId}:${guestCodigo}`
  const { data: list, error: listErr } = await supabase
    .from("cupones")
    .select("id, usado, usado_nombre")
    .eq("categoria", REFERRAL_CATEGORY)
    .ilike("usado_nombre", `${marker}%`)

  if (listErr || !list?.length) return { deleted: 0 }

  const ids = list.filter((r) => !r.usado).map((r) => r.id as string)
  if (ids.length === 0) return { deleted: 0 }
  const { error } = await supabase.from("cupones").delete().in("id", ids)
  if (error) throw error
  return { deleted: ids.length }
}
