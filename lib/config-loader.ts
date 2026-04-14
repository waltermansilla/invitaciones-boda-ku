import fs from "fs"
import path from "path"

interface EventConfig {
  meta?: {
    coupleNames?: {
      groomName?: string
      brideName?: string
      name?: string // para XV
    }
  }
  rsvpPanel?: {
    enabled?: boolean
    panelId?: string
    fechaEvento?: string
    theme?: Record<string, unknown>
    labels?: Record<string, unknown>
  }
  slug?: string
  tipo?: "boda" | "xv" | "baby" | "cumple" | "evento"
}

// Todos los tipos de eventos soportados
const TIPOS_EVENTO = ["boda", "xv", "baby", "cumple", "evento"] as const

// Busca el JSON que tenga el panelId especificado
export function findConfigByPanelId(panelId: string): EventConfig | null {
  const dataDir = path.join(process.cwd(), "data", "clientes")
  
  // Buscar en todos los tipos de eventos
  for (const tipo of TIPOS_EVENTO) {
    const tipoDir = path.join(dataDir, tipo)
    if (fs.existsSync(tipoDir)) {
      const files = fs.readdirSync(tipoDir).filter(f => f.endsWith(".json"))
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(tipoDir, file), "utf-8")
          const config = JSON.parse(content) as EventConfig
          if (config.rsvpPanel?.panelId === panelId) {
            return { ...config, slug: file.replace(".json", ""), tipo }
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
    nombreEvento = config.meta.coupleNames.name
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
