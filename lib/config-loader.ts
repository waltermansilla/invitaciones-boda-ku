import fs from "fs"
import path from "path"
import { listClienteTipoDirNames } from "@/lib/client-json-helpers"

interface EventConfig {
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

// Busca el JSON que tenga el panelId especificado
export function findConfigByPanelId(panelId: string): EventConfig | null {
  const dataDir = path.join(process.cwd(), "data", "clientes")

  for (const tipo of listClienteTipoDirNames()) {
    const tipoDir = path.join(dataDir, tipo)
    if (fs.existsSync(tipoDir)) {
      const files = fs.readdirSync(tipoDir).filter(f => f.endsWith(".json"))
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(tipoDir, file), "utf-8")
          const config = JSON.parse(content) as EventConfig
          if (config.rsvpPanel?.panelId === panelId) {
            return { ...config, slug: slugFromFileName(file), tipo }
          }
        } catch { /* ignore */ }
      }
    }
  }
  
  return null
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
