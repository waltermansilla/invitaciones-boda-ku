import type { ClientConfig } from "@/lib/get-client-config"

export type ExtraInputA4Def = {
  /** Encabezado en la planilla A4 */
  columnTitle: string
  /** Equivale a `tituloPanel` y `label` del JSON para reconocer líneas guardadas */
  matchKeys: string[]
}

export type ExtraInputA4BottomDef = {
  /** Título debajo de la tabla: `tituloPanel` efectivo + "s". */
  blockTitle: string
  matchKeys: string[]
}

export type ExtraInputsA4Layout = {
  columns: ExtraInputA4Def[]
  bottom: ExtraInputA4BottomDef[]
}

function pluralTituloA4(panelTitleRaw: string, fallbackStem: string): string {
  const stem = panelTitleRaw.trim() || fallbackStem.trim() || "Mensaje"
  return `${stem}s`
}

function normalizeA4Placement(rec: Record<string, unknown>): "label" | "bottom" | null {
  if (rec.labelA4 === true) return "label"
  const raw = rec.a4
  if (typeof raw !== "string") return null
  const k = raw.trim().toLowerCase()
  if (k === "label" || k === "bottom") return k
  return null
}

function mergeKeysFromExtraInput(rec: Record<string, unknown>): {
  columnTitle: string
  matchKeys: string[]
} {
  const idStr = typeof rec.id === "string" ? rec.id.trim() : ""
  const label = typeof rec.label === "string" ? rec.label.trim() : ""
  const tituloPanel =
    typeof rec.tituloPanel === "string" ? rec.tituloPanel.trim() : ""
  const columnTitle = tituloPanel || label || idStr || "Dato extra"
  const keys = [...new Set([tituloPanel, label].filter(Boolean))]
  const matchKeys = keys.length > 0 ? keys : idStr ? [idStr] : [columnTitle]
  return { columnTitle, matchKeys }
}

/** Igual idea que RSVP `parsePerMemberEntries` para leer pipe + dos puntos. */
export function parsePerMemberEntriesStored(
  raw: string | undefined,
): Array<{ memberName: string; label?: string; value: string }> {
  if (!raw) return []
  const entries: Array<{ memberName: string; label?: string; value: string }> =
    []
  raw.split("|")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      const colonIdx = chunk.indexOf(":")
      if (colonIdx <= 0) return
      const left = chunk.slice(0, colonIdx).trim()
      const value = chunk.slice(colonIdx + 1).trim()
      if (!left || !value) return
      if (left.includes(" - ")) {
        const [memberNameRaw, labelRaw] = left.split(" - ")
        const memberName = memberNameRaw?.trim()
        const label = labelRaw?.trim()
        if (!memberName) return
        entries.push({ memberName, label: label || undefined, value })
        return
      }
      entries.push({ memberName: left, value })
    })
  return entries
}

/**
 * `a4: "label"` → columnas en la tabla. `a4: "bottom"` → bloque bajo la planilla (nombre + texto).
 * Compat: `labelA4: true` → mismo que `"label"`.
 */
export function extraInputsA4LayoutFromMergedClient(
  merged: ClientConfig | Record<string, unknown>,
): ExtraInputsA4Layout {
  const sections = (merged as { sections?: unknown }).sections
  const arr = Array.isArray(sections) ? sections : []
  const rsvp = arr.find(
    (s: unknown) =>
      typeof s === "object" &&
      s !== null &&
      (s as Record<string, unknown>).type === "rsvp",
  ) as Record<string, unknown> | undefined
  const data =
    rsvp?.data && typeof rsvp.data === "object"
      ? (rsvp.data as Record<string, unknown>)
      : {}
  const fields =
    data.fields && typeof data.fields === "object"
      ? (data.fields as Record<string, unknown>)
      : {}
  const extraInputs = Array.isArray(fields.extraInputs)
    ? fields.extraInputs
    : []
  const columns: ExtraInputA4Def[] = []
  const bottom: ExtraInputA4BottomDef[] = []
  for (const rawIn of extraInputs) {
    if (!rawIn || typeof rawIn !== "object") continue
    const rec = rawIn as Record<string, unknown>
    const placement = normalizeA4Placement(rec)
    if (!placement) continue
    const { columnTitle, matchKeys } = mergeKeysFromExtraInput(rec)
    const tituloPanel =
      typeof rec.tituloPanel === "string" ? rec.tituloPanel.trim() : ""
    const idStr = typeof rec.id === "string" ? rec.id.trim() : ""
    const label = typeof rec.label === "string" ? rec.label.trim() : ""
    if (placement === "label") {
      columns.push({ columnTitle, matchKeys })
    } else {
      bottom.push({
        blockTitle: pluralTituloA4(tituloPanel, label || idStr || columnTitle),
        matchKeys,
      })
    }
  }
  return { columns, bottom }
}

/** @deprecated Usar extraInputsA4LayoutFromMergedClient; solo exporta columnas. */
export function extraInputsA4DefsFromMergedClient(
  merged: ClientConfig | Record<string, unknown>,
): ExtraInputA4Def[] {
  return extraInputsA4LayoutFromMergedClient(merged).columns
}

/** Valor de un campo extra (`mensaje` agregado en DB). */
export function resolveExtraValueFromStoredMensaje(
  raw: string | undefined,
  personaNombre: string,
  matchKeys: string[],
  allowOrphanTituloChunks: boolean,
): string {
  const name = personaNombre.trim()
  const keys = [...new Set(matchKeys.map((k) => k.trim()).filter(Boolean))]
  if (!raw?.trim() || keys.length === 0) return "-"

  const entries = parsePerMemberEntriesStored(raw)
  const labelMatches = (label: string | undefined) =>
    Boolean(label?.trim()) && keys.some((k) => label!.trim() === k)

  for (const e of entries) {
    if (e.memberName.trim() !== name) continue
    if (e.label && labelMatches(e.label))
      return (e.value.trim() || "-").length ? e.value.trim() : "-"
  }

  if (allowOrphanTituloChunks) {
    for (const e of entries) {
      if (e.label) continue
      const leftKey = e.memberName.trim()
      if (keys.includes(leftKey)) return e.value.trim() || "-"
    }
  }

  return "-"
}
