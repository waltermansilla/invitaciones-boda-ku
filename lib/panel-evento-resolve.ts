import { createApiClient } from "@/lib/supabase/api"
import {
  canonicalPanelIdFromConfig,
  panelIdsForEventLookup,
  type EventConfig,
} from "@/lib/config-loader"

type EventoRow = Record<string, unknown> & {
  id?: string
  panel_id?: string
}

export type ResolveEventoResult =
  | { ok: true; evento: EventoRow }
  | { ok: false; reason: "none" | "ambiguous"; count?: number }

/**
 * Busca la fila `eventos` cuyo `panel_id` coincide con el id canónico del JSON
 * o con algún valor de `rsvpPanel.legacyPanelIds`. Si encuentra una fila con un
 * id viejo y el JSON ya tiene otro `panelId`, actualiza `panel_id` al canónico
 * (misma fila, mismos invitados).
 */
export async function resolveEventoForPanelConfig(
  supabase: ReturnType<typeof createApiClient>,
  config: EventConfig,
): Promise<ResolveEventoResult> {
  const candidates = panelIdsForEventLookup(config)
  if (candidates.length === 0) {
    return { ok: false, reason: "none" }
  }

  const { data: rows, error } = await supabase
    .from("eventos")
    .select("*")
    .in("panel_id", candidates)

  if (error) {
    throw new Error(error.message || "Error leyendo evento")
  }

  const list = (rows || []) as EventoRow[]
  if (list.length === 0) {
    return { ok: false, reason: "none" }
  }
  if (list.length > 1) {
    return { ok: false, reason: "ambiguous", count: list.length }
  }

  const evento = list[0]
  const canonical = canonicalPanelIdFromConfig(config)
  const currentPid =
    typeof evento.panel_id === "string" ? evento.panel_id.trim() : ""

  if (canonical && currentPid && currentPid !== canonical) {
    const { error: upErr } = await supabase
      .from("eventos")
      .update({ panel_id: canonical })
      .eq("id", evento.id as string)

    if (upErr) {
      throw new Error(upErr.message || "Error actualizando panel_id del evento")
    }
    evento.panel_id = canonical
  }

  return { ok: true, evento }
}
