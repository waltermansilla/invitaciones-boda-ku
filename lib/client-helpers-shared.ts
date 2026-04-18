/**
 * Helpers sin Node (fs): seguros para importar desde "use client".
 */

/** Título corto para admin / Excel según carpeta (boda, xv, baby, …). */
export function eventTypeLabelFromFolderTipo(tipo: string): string {
  const t = tipo.toLowerCase()
  const known: Record<string, string> = {
    boda: "Boda",
    xv: "XV",
    baby: "Baby shower",
    cumple: "Cumpleaños",
    evento: "Evento",
  }
  if (known[t]) return known[t]
  return tipo
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

/**
 * `{slug}-{tipo}` → `/${tipo}/${slug}` (sin validar carpeta; fallback en cliente si la API no envió ruta).
 */
export function invitationPathFromPanelIdSlug(panelId: string): string | null {
  const last = panelId.lastIndexOf("-")
  if (last <= 0) return null
  const slug = panelId.slice(0, last)
  const tipo = panelId.slice(last + 1)
  if (!slug || !tipo) return null
  return `/${tipo}/${slug}`
}

/** Nombre legible del proyecto desde el JSON (invitación). */
export function displayNameFromClientJson(
  json: Record<string, unknown> & {
    meta?: {
      coupleNames?: { groomName?: string; brideName?: string; name?: string }
      quinceaneraName?: string
    }
  },
): string {
  const meta = json.meta
  if (!meta) return ""
  const couple = meta.coupleNames
  if (couple) {
    const bride = (couple.brideName || "").trim()
    const groom = (couple.groomName || "").trim()
    if (bride && groom) return `${bride} y ${groom}`
    if (bride) return bride
    if (groom) return groom
    const xvName = (couple.name || "").trim()
    if (xvName) return xvName
  }
  const q = (meta.quinceaneraName || "").trim()
  if (q) return q
  return ""
}
