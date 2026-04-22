import fs from "fs"
import path from "path"
import { listClienteTipoDirNames } from "@/lib/client-json-helpers"

export interface EventConfig {
  meta?: {
    coupleNames?: {
      groomName?: string
      brideName?: string
      name?: string // para XV
    }
    quinceaneraName?: string
  }
  rsvpPanel?: {
    enabled?: boolean
    panelId?: string
    /** "formulario" (default) = bloque rsvp + API. "comun" = confirmar por WA pero sincroniza panel; solo personas en el panel. */
    confirmacion?: "formulario" | "comun"
    fechaEvento?: string
    theme?: Record<string, unknown>
    labels?: Record<string, unknown>
    confirmationMessage?: string
    /** Tope de plazas en el panel (persona=1; familia=cantidad de integrantes). Sin clave = sin límite. */
    limiteInvitados?: number
    /**
     * Ids de panel anteriores que siguen apuntando al mismo evento en Supabase.
     * Al cambiar `panelId`, agregá el valor viejo acá hasta que la fila `eventos`
     * se haya actualizado al nuevo id (ocurre en el primer GET del panel).
     */
    legacyPanelIds?: string[]
  }
  slug?: string
  /** Carpeta bajo data/clientes/ (boda, xv, baby, cumple, …) */
  tipo?: string
  access?: {
    tokenEnabled?: boolean
    token?: string
  }
}

function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/i, "").replace(/^\d+-/, "")
}

function panelIdMatchesRsvp(config: EventConfig, candidate: string): boolean {
  const c = candidate.trim()
  if (!c) return false
  const primary = config.rsvpPanel?.panelId
  if (typeof primary === "string" && primary.trim() === c) return true
  const leg = config.rsvpPanel?.legacyPanelIds
  if (!Array.isArray(leg)) return false
  return leg.some((x) => typeof x === "string" && x.trim() === c)
}

/** Id canónico actual del panel (el que debe quedar en Supabase tras migrar). */
export function canonicalPanelIdFromConfig(config: EventConfig): string | null {
  const p = config.rsvpPanel?.panelId
  if (typeof p !== "string") return null
  const t = p.trim()
  return t || null
}

/** Todos los `panel_id` posibles en DB para este cliente (canónico + legados). */
export function panelIdsForEventLookup(config: EventConfig): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (s: string | undefined) => {
    const t = typeof s === "string" ? s.trim() : ""
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(t)
  }
  add(config.rsvpPanel?.panelId)
  const leg = config.rsvpPanel?.legacyPanelIds
  if (Array.isArray(leg)) {
    for (const x of leg) add(typeof x === "string" ? x : undefined)
  }
  return out
}

export function eventoPanelIdMatchesConfig(
  eventoPanelId: unknown,
  config: EventConfig,
): boolean {
  if (typeof eventoPanelId !== "string" || !eventoPanelId.trim()) return false
  const allowed = new Set(panelIdsForEventLookup(config))
  return allowed.has(eventoPanelId.trim())
}

// Busca el JSON cuyo panelId canónico o legacy coincide con `panelId`
export function findConfigByPanelId(panelId: string): EventConfig | null {
  const dataDir = path.join(process.cwd(), "data", "clientes")
  const needle = panelId.trim()
  if (!needle) return null

  for (const tipo of listClienteTipoDirNames()) {
    const tipoDir = path.join(dataDir, tipo)
    if (fs.existsSync(tipoDir)) {
      const files = fs.readdirSync(tipoDir).filter(f => f.endsWith(".json"))
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(tipoDir, file), "utf-8")
          const config = JSON.parse(content) as EventConfig
          if (panelIdMatchesRsvp(config, needle)) {
            return { ...config, slug: slugFromFileName(file), tipo }
          }
        } catch { /* ignore */ }
      }
    }
  }

  return null
}

/**
 * Panel usable solo si el `panelId` coincide con un JSON de cliente y
 * `rsvpPanel.enabled` es true. Evita crear eventos en Supabase con IDs inventados.
 */
export function getAuthorizedPanelConfig(panelId: string): EventConfig | null {
  const config = findConfigByPanelId(panelId)
  if (!config?.rsvpPanel?.enabled) return null
  return config
}

// Extrae los datos relevantes para el evento
export function getEventDataFromConfig(config: EventConfig) {
  const tipo = config.tipo || "boda"

  let nombreEvento = ""
  if (tipo === "xv" && config.meta?.coupleNames?.name) {
    nombreEvento = String(config.meta.coupleNames.name).trim()
  } else if (config.meta?.quinceaneraName) {
    nombreEvento = String(config.meta.quinceaneraName).trim()
  } else if (config.meta?.coupleNames) {
    const { groomName, brideName } = config.meta.coupleNames
    nombreEvento = `${brideName || ""} & ${groomName || ""}`.trim()
  }
  
  return {
    tipo_evento: tipo,
    nombre_evento: nombreEvento,
    fecha_evento: config.rsvpPanel?.fechaEvento || null,
    slug: config.slug,
    panel_theme: config.rsvpPanel?.theme ?? null,
    panel_labels: config.rsvpPanel?.labels ?? null,
  }
}

/** Ruta pública de la invitación (`/boda/slug`, `/baby/maxima`, …). */
export function invitationPublicPathFromConfig(
  config: Pick<EventConfig, "tipo" | "slug"> | null,
): string | null {
  if (!config?.tipo || !config.slug) return null
  return `/${config.tipo}/${config.slug}`
}

/** Token público de acceso para la invitación (`?k=`), si existe en el JSON. */
export function invitationAccessTokenFromConfig(
  config: Pick<EventConfig, "access"> | null,
): string | null {
  const token = config?.access?.token
  if (!config?.access?.tokenEnabled) return null
  if (typeof token !== "string") return null
  const clean = token.trim()
  if (!/^[A-Za-z0-9]{6}$/.test(clean)) return null
  return clean
}
