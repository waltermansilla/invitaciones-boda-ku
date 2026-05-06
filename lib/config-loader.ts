import fs from "fs"
import path from "path"
import { listClienteTipoDirNames } from "@/lib/client-json-helpers"

export interface EventConfig {
  base?: {
    enabled?: boolean
    token?: string
    title?: string
    subtitle?: string
  }
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
    defaultVariante?: string
    confirmationMessage?: string
    /** Solo con `confirmacion: formulario`: RSVP sin ?i= puede crear invitado en el panel. */
    registrarSinCodigoEnPanel?: boolean
    /** Habilita cupo de colados por invitado/familia desde panel + RSVP. */
    colados?: boolean
    /**
     * Palabra(s) en singular para el invitado extra (default "colado").
     * En UI el plural añade "s" a cada palabra separada por espacios.
     * Recomendado: palabras que en -s suenan bien (colado, amigo, persona extra, …).
     */
    coladoLabel?: string
    /**
     * Tope máximo de `cupo_colados` por invitado al cargarlo desde el panel (0…N).
     * Sin clave o valor inválido = 5.
     */
    limiteColados?: number
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
  variants?: Record<string, unknown>
}

export interface PanelVariantDefinition {
  id: string
  label: string
  invitationVariant?: string
  eventTypeLabel?: string
  eventName?: string
  legacyIds?: string[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMergeRecord(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = out[key]
    out[key] =
      isPlainObject(baseValue) && isPlainObject(patchValue)
        ? deepMergeRecord(baseValue, patchValue)
        : patchValue
  }
  return out
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

function baseTokenMatches(config: EventConfig, candidate: string): boolean {
  const c = candidate.trim()
  if (!c) return false
  if (!config.base?.enabled) return false
  const token = config.base?.token
  return typeof token === "string" && token.trim() === c
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

// Busca el JSON cuyo base.token coincide con `token`
export function findConfigByBaseToken(token: string): EventConfig | null {
  const dataDir = path.join(process.cwd(), "data", "clientes")
  const needle = token.trim()
  if (!needle) return null

  for (const tipo of listClienteTipoDirNames()) {
    const tipoDir = path.join(dataDir, tipo)
    if (fs.existsSync(tipoDir)) {
      const files = fs.readdirSync(tipoDir).filter((f) => f.endsWith(".json"))
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(tipoDir, file), "utf-8")
          const config = JSON.parse(content) as EventConfig
          if (baseTokenMatches(config, needle)) {
            return { ...config, slug: slugFromFileName(file), tipo }
          }
        } catch {
          /* ignore */
        }
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

export function panelVariantesFromConfig(
  config: EventConfig,
): { variantes: PanelVariantDefinition[]; defaultVariante: string } {
  const raw = config.variants
  const out: PanelVariantDefinition[] = []
  let baseLabel = "Principal"
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [id, value] of Object.entries(raw)) {
      const cleanId = id.trim()
      if (!cleanId) continue
      if (cleanId.startsWith("_")) continue
      const v = value && typeof value === "object" ? value : {}
      const baseLabelRaw =
        "baseLabel" in (v as Record<string, unknown>)
          ? (v as Record<string, unknown>).baseLabel
          : undefined
      if (
        typeof baseLabelRaw === "string" &&
        baseLabelRaw.trim() &&
        baseLabel === "Principal"
      ) {
        baseLabel = baseLabelRaw.trim()
      }
      const labelRaw =
        "label" in (v as Record<string, unknown>)
          ? (v as Record<string, unknown>).label
          : undefined
      const invitationVariantRaw =
        "invitationVariant" in (v as Record<string, unknown>)
          ? (v as Record<string, unknown>).invitationVariant
          : undefined
      const eventTypeLabelRaw =
        "eventTypeLabel" in (v as Record<string, unknown>)
          ? (v as Record<string, unknown>).eventTypeLabel
          : undefined
      const eventNameRaw =
        "eventName" in (v as Record<string, unknown>)
          ? (v as Record<string, unknown>).eventName
          : undefined
      const legacyIdsRaw =
        "legacyIds" in (v as Record<string, unknown>)
          ? (v as Record<string, unknown>).legacyIds
          : undefined
      const legacyIds = Array.isArray(legacyIdsRaw)
        ? legacyIdsRaw
            .filter((x) => typeof x === "string")
            .map((x) => x.trim())
            .filter(Boolean)
        : []
      out.push({
        id: cleanId,
        label:
          typeof labelRaw === "string" && labelRaw.trim()
            ? labelRaw.trim()
            : cleanId,
        invitationVariant:
          typeof invitationVariantRaw === "string" &&
          invitationVariantRaw.trim()
            ? invitationVariantRaw.trim()
            : cleanId,
        eventTypeLabel:
          typeof eventTypeLabelRaw === "string" && eventTypeLabelRaw.trim()
            ? eventTypeLabelRaw.trim()
            : undefined,
        eventName:
          typeof eventNameRaw === "string" && eventNameRaw.trim()
            ? eventNameRaw.trim()
            : undefined,
        legacyIds: legacyIds.length ? legacyIds : undefined,
      })
    }
  }
  const defaultVarianteRaw = config.rsvpPanel?.defaultVariante
  const fallbackDefault = "default"
  const defaultVariante =
    typeof defaultVarianteRaw === "string" &&
    (defaultVarianteRaw.trim() === "default" ||
      out.some((v) => v.id === defaultVarianteRaw.trim()))
      ? defaultVarianteRaw.trim()
      : fallbackDefault
  return {
    variantes: [{ id: "default", label: baseLabel }, ...out],
    defaultVariante,
  }
}

/**
 * Theme/labels efectivos del panel para la variante `pv`.
 * Mezcla solo `variants[pv].rsvpPanel.theme|labels` sobre la base.
 */
export function panelDisplayForVariant(
  config: EventConfig,
  variantId: string,
): {
  panel_theme: Record<string, unknown> | null
  panel_labels: Record<string, unknown> | null
  panel_fecha_evento: string | null
} {
  const baseTheme = isPlainObject(config.rsvpPanel?.theme)
    ? config.rsvpPanel.theme
    : null
  const baseLabels = isPlainObject(config.rsvpPanel?.labels)
    ? config.rsvpPanel.labels
    : null

  const baseFechaEvento =
    typeof config.rsvpPanel?.fechaEvento === "string" &&
    config.rsvpPanel.fechaEvento.trim()
      ? config.rsvpPanel.fechaEvento.trim()
      : null

  if (!variantId || variantId === "default") {
    return {
      panel_theme: baseTheme,
      panel_labels: baseLabels,
      panel_fecha_evento: baseFechaEvento,
    }
  }

  const variantsRaw = config.variants
  if (!isPlainObject(variantsRaw)) {
    return {
      panel_theme: baseTheme,
      panel_labels: baseLabels,
      panel_fecha_evento: baseFechaEvento,
    }
  }
  const variantRaw = variantsRaw[variantId]
  if (!isPlainObject(variantRaw)) {
    return {
      panel_theme: baseTheme,
      panel_labels: baseLabels,
      panel_fecha_evento: baseFechaEvento,
    }
  }
  const rsvpPanelPatch = variantRaw.rsvpPanel
  if (!isPlainObject(rsvpPanelPatch)) {
    return {
      panel_theme: baseTheme,
      panel_labels: baseLabels,
      panel_fecha_evento: baseFechaEvento,
    }
  }

  const themePatch = isPlainObject(rsvpPanelPatch.theme)
    ? rsvpPanelPatch.theme
    : null
  const labelsPatch = isPlainObject(rsvpPanelPatch.labels)
    ? rsvpPanelPatch.labels
    : null
  const fechaEventoPatch =
    typeof rsvpPanelPatch.fechaEvento === "string" &&
    rsvpPanelPatch.fechaEvento.trim()
      ? rsvpPanelPatch.fechaEvento.trim()
      : null

  return {
    panel_theme: themePatch
      ? deepMergeRecord(baseTheme || {}, themePatch)
      : baseTheme,
    panel_labels: labelsPatch
      ? deepMergeRecord(baseLabels || {}, labelsPatch)
      : baseLabels,
    panel_fecha_evento: fechaEventoPatch ?? baseFechaEvento,
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
