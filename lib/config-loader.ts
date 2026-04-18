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
    fechaEvento?: string
    theme?: Record<string, unknown>
    labels?: Record<string, unknown>
  }
  slug?: string
  /** Carpeta bajo data/clientes/ (boda, xv, baby, cumple, …) */
  tipo?: string
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
