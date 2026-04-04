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
  }
  slug?: string
  tipo?: "boda" | "xv"
}

// Busca el JSON que tenga el panelId especificado
export function findConfigByPanelId(panelId: string): EventConfig | null {
  const dataDir = path.join(process.cwd(), "data", "clientes")
  
  // Buscar en bodas
  const bodasDir = path.join(dataDir, "boda")
  if (fs.existsSync(bodasDir)) {
    const bodasFiles = fs.readdirSync(bodasDir).filter(f => f.endsWith(".json"))
    for (const file of bodasFiles) {
      try {
        const content = fs.readFileSync(path.join(bodasDir, file), "utf-8")
        const config = JSON.parse(content) as EventConfig
        if (config.rsvpPanel?.panelId === panelId) {
          return { ...config, slug: file.replace(".json", ""), tipo: "boda" }
        }
      } catch { /* ignore */ }
    }
  }
  
  // Buscar en XV
  const xvDir = path.join(dataDir, "xv")
  if (fs.existsSync(xvDir)) {
    const xvFiles = fs.readdirSync(xvDir).filter(f => f.endsWith(".json"))
    for (const file of xvFiles) {
      try {
        const content = fs.readFileSync(path.join(xvDir, file), "utf-8")
        const config = JSON.parse(content) as EventConfig
        if (config.rsvpPanel?.panelId === panelId) {
          return { ...config, slug: file.replace(".json", ""), tipo: "xv" }
        }
      } catch { /* ignore */ }
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
    slug: config.slug
  }
}
